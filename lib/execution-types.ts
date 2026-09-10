/**
 * Execution Tracking & Telemetry Types and Client-Safe Utilities
 * Safe for both Client Components and Server-Side execution.
 */

export interface ExecutionLog {
  id: string;
  timestamp: string; // ISO 8601 string
  placeId: number;
  universeId: number;
  gameName: string;
  sessionId: string;
  status: 'supported' | 'unknown';
}

export interface ExecutionDataStore {
  totalExecutions: number;
  // Map of date string (YYYY-MM-DD) -> total execution count for that day
  dailyCounts: Record<string, number>;
  // Map of gameName -> total execution count for that game
  gameCounts: Record<string, number>;
  // Recent raw logs (capped to prevent unbounded size)
  recentLogs: ExecutionLog[];
  // Deduplication set of recent session IDs: sessionId -> timestampMs
  recentSessions: Record<string, number>;
  lastUpdated: string;
}

export interface ExecutionAnalytics {
  totalExecutions: number;
  executionsToday: number;
  executionsLast7Days: number;
  executionsLast30Days: number;
  mostExecutedGame: {
    name: string;
    count: number;
  } | null;
  executionsByGame: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  dailyTimeline: Array<{
    date: string; // YYYY-MM-DD
    label: string; // e.g. "Sep 10"
    count: number;
  }>;
  totalLogsInStore: number;
  clearedLogsCount: number;
}

/**
 * Format large numbers to human readable string (e.g. 1.2K, 25.4K, 1.3M)
 */
export function formatExecutionCount(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '0';
  if (num < 1000) return num.toLocaleString();

  if (num < 1_000_000) {
    const k = num / 1000;
    // If >= 100k, show whole number like 120K; if < 100k, show 1 decimal like 25.4K
    const formatted = k >= 100 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }

  const m = num / 1_000_000;
  const formatted = m >= 100 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, '');
  return `${formatted}M`;
}
