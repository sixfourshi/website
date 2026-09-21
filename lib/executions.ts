import { readJson, writeJson, isSupabaseStorageConfigured } from './supabase-storage';
import { getStoredGames } from './storage';
import {
  type ExecutionLog,
  type ExecutionAnalytics,
  formatExecutionCount,
} from './execution-types';

export type { ExecutionLog, ExecutionAnalytics };
export { formatExecutionCount };

export interface ExecutionDataStore {
  totalExecutions: number;
  executionsByGame: Record<string, number>;
  dailyCounts: Record<string, number>; // YYYY-MM-DD -> count
  recentLogs: ExecutionLog[];
  recentSessionIds: string[];
  clearedLogsCount: number;
  lastUpdated: string;
}

const STORAGE_EXECUTIONS_PATH = 'sourhub/executions.json';

const DEFAULT_STORE: ExecutionDataStore = {
  totalExecutions: 0,
  executionsByGame: {},
  dailyCounts: {},
  recentLogs: [],
  recentSessionIds: [],
  clearedLogsCount: 0,
  lastUpdated: new Date().toISOString(),
};

let memoryExecutionStore: ExecutionDataStore | null = null;

// In-memory IP rate limiter (never logs or persists IPs)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // max 40 executions per minute per IP

export function checkRateLimit(ip: string): boolean {
  if (!ip) return true;
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  // Periodic cleanup if map grows too large
  if (rateLimitMap.size > 2000) {
    for (const [key, times] of rateLimitMap.entries()) {
      const active = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    }
  }

  return true;
}

/**
 * Read executions data from private Supabase Storage bucket.
 */
export async function getStoredExecutions(): Promise<ExecutionDataStore> {
  if (!isSupabaseStorageConfigured()) {
    if (memoryExecutionStore) return memoryExecutionStore;
    return { ...DEFAULT_STORE, lastUpdated: new Date().toISOString() };
  }

  const parsed = await readJson<ExecutionDataStore>(STORAGE_EXECUTIONS_PATH);
  if (parsed && typeof parsed.totalExecutions === 'number') {
    const store: ExecutionDataStore = {
      totalExecutions: typeof parsed.totalExecutions === 'number' ? parsed.totalExecutions : 0,
      executionsByGame: parsed.executionsByGame && typeof parsed.executionsByGame === 'object' ? parsed.executionsByGame : {},
      dailyCounts: parsed.dailyCounts && typeof parsed.dailyCounts === 'object' ? parsed.dailyCounts : {},
      recentLogs: Array.isArray(parsed.recentLogs) ? parsed.recentLogs : [],
      recentSessionIds: Array.isArray(parsed.recentSessionIds) ? parsed.recentSessionIds : [],
      clearedLogsCount: typeof parsed.clearedLogsCount === 'number' ? parsed.clearedLogsCount : 0,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
    memoryExecutionStore = store;
    return store;
  }

  // If storage is configured but the file does not exist yet, seed initial empty store
  const initialStore: ExecutionDataStore = { ...DEFAULT_STORE, lastUpdated: new Date().toISOString() };
  await writeJson(STORAGE_EXECUTIONS_PATH, initialStore);
  memoryExecutionStore = initialStore;
  return initialStore;
}

/**
 * Save executions data persistently to private Supabase Storage bucket.
 * Falls back to in-memory store if Supabase Storage is unconfigured.
 */
export async function saveStoredExecutions(data: ExecutionDataStore): Promise<void> {
  memoryExecutionStore = data;
  if (!isSupabaseStorageConfigured()) {
    return;
  }

  await writeJson(STORAGE_EXECUTIONS_PATH, data);
}

/**
 * Match Place/Universe ID against stored games, or safely fetch from Roblox API.
 */
export async function resolveRobloxGame(
  placeId: number,
  universeId: number
): Promise<{ gameName: string; status: 'supported' | 'unknown' }> {
  try {
    const storedGames = await getStoredGames();

    // Match placeId or universeId against stored games
    const matched = storedGames.find((g) => {
      if (g.rootPlaceId && g.rootPlaceId === placeId) return true;
      if (g.universeId && (g.universeId === universeId || g.universeId === placeId)) return true;
      return false;
    });

    if (matched) {
      return { gameName: matched.name, status: 'supported' };
    }
  } catch (err) {
    console.warn('[Executions] Could not check stored games:', err);
  }

  // If unknown, safely fetch the experience name from Roblox API
  let fetchedName: string | null = null;

  if (universeId && universeId > 0) {
    try {
      const res = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
        signal: AbortSignal.timeout(3500),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data && json.data.length > 0 && json.data[0]?.name) {
          fetchedName = String(json.data[0].name).trim();
        }
      }
    } catch {}
  }

  if (!fetchedName && placeId && placeId > 0) {
    try {
      const res = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
        signal: AbortSignal.timeout(3500),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.universeId) {
          const uRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${json.universeId}`, {
            signal: AbortSignal.timeout(3500),
            headers: { Accept: 'application/json' },
          });
          if (uRes.ok) {
            const uJson = await uRes.json();
            if (uJson?.data?.[0]?.name) {
              fetchedName = String(uJson.data[0].name).trim();
            }
          }
        }
      }
    } catch {}
  }

  return {
    gameName: fetchedName || `Roblox Experience #${placeId || universeId}`,
    status: 'unknown',
  };
}

/**
 * Record a valid execution.
 * - Deduplicates by sessionId
 * - Updates persistent aggregate counters (totalExecutions, executionsByGame, dailyCounts)
 * - Adds to recentLogs (capped)
 * - Returns small success response
 */
export async function recordExecution({
  placeId,
  universeId,
  sessionId,
}: {
  placeId: number;
  universeId: number;
  sessionId: string;
}): Promise<{ success: boolean; message: string; deduplicated?: boolean }> {
  const store = await getStoredExecutions();

  // Deduplicate: check if sessionId has already been recorded
  if (store.recentSessionIds.includes(sessionId)) {
    return {
      success: true,
      message: 'Execution already counted.',
      deduplicated: true,
    };
  }

  // Resolve game identity
  const { gameName, status } = await resolveRobloxGame(placeId, universeId);

  const now = new Date();
  const timestamp = now.toISOString();
  const dayKey = timestamp.slice(0, 10); // YYYY-MM-DD

  // Update cumulative totals (never lost even if detailed logs are cleared)
  store.totalExecutions = (store.totalExecutions || 0) + 1;
  store.executionsByGame[gameName] = (store.executionsByGame[gameName] || 0) + 1;
  store.dailyCounts[dayKey] = (store.dailyCounts[dayKey] || 0) + 1;

  // Track session ID for deduplication
  store.recentSessionIds.unshift(sessionId);
  if (store.recentSessionIds.length > 5000) {
    store.recentSessionIds = store.recentSessionIds.slice(0, 5000);
  }

  // Create detailed execution log
  const log: ExecutionLog = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    sessionId,
    placeId,
    universeId,
    gameName,
    status,
    timestamp,
  };

  store.recentLogs.unshift(log);
  if (store.recentLogs.length > 3000) {
    store.recentLogs = store.recentLogs.slice(0, 3000);
  }

  store.lastUpdated = timestamp;

  // Persist to private Supabase Storage
  await saveStoredExecutions(store);

  return {
    success: true,
    message: 'Execution recorded successfully.',
  };
}

/**
 * Owner-only action to clear old detailed logs.
 * Preserves totalExecutions, executionsByGame, and dailyCounts so
 * all historical totals and charts remain 100% accurate!
 */
export async function clearOldExecutionLogs(
  option: 'all' | 'older_7_days' | 'older_30_days'
): Promise<{ clearedCount: number; remainingCount: number }> {
  const store = await getStoredExecutions();
  const initialLength = store.recentLogs.length;

  if (option === 'all') {
    store.clearedLogsCount = (store.clearedLogsCount || 0) + store.recentLogs.length;
    store.recentLogs = [];
    store.lastUpdated = new Date().toISOString();
    await saveStoredExecutions(store);
    return {
      clearedCount: initialLength,
      remainingCount: 0,
    };
  }

  const cutoffDays = option === 'older_7_days' ? 7 : 30;
  const cutoffTime = Date.now() - cutoffDays * 24 * 60 * 60 * 1000;

  const remaining = store.recentLogs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= cutoffTime;
  });

  const cleared = initialLength - remaining.length;
  store.clearedLogsCount = (store.clearedLogsCount || 0) + cleared;
  store.recentLogs = remaining;
  store.lastUpdated = new Date().toISOString();

  await saveStoredExecutions(store);

  return {
    clearedCount: cleared,
    remainingCount: remaining.length,
  };
}

/**
 * Compute aggregate analytics for top cards and charts.
 */
export function computeAnalytics(store: ExecutionDataStore): ExecutionAnalytics {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  // Executions today
  const executionsToday = store.dailyCounts[todayKey] || 0;

  // Executions last 7 days & last 30 days
  let executionsLast7Days = 0;
  let executionsLast30Days = 0;

  const timelineDays = 30;
  const dailyTimeline: { date: string; label: string; count: number }[] = [];

  for (let i = timelineDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = store.dailyCounts[key] || 0;

    // Month / day label e.g. "Sep 10"
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyTimeline.push({ date: key, label, count });

    if (i < 7) {
      executionsLast7Days += count;
    }
    executionsLast30Days += count;
  }

  // Executions by game
  const gameEntries = Object.entries(store.executionsByGame || {}).sort((a, b) => b[1] - a[1]);
  const total = store.totalExecutions || 0;

  const executionsByGame = gameEntries.map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  const mostExecutedGame =
    gameEntries.length > 0 && gameEntries[0][1] > 0
      ? { name: gameEntries[0][0], count: gameEntries[0][1] }
      : null;

  return {
    totalExecutions: total,
    executionsToday,
    executionsLast7Days,
    executionsLast30Days,
    mostExecutedGame,
    executionsByGame,
    dailyTimeline,
    totalLogsInStore: store.recentLogs.length,
    clearedLogsCount: store.clearedLogsCount || 0,
  };
}
