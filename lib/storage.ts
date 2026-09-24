import fs from 'fs/promises';
import path from 'path';
import { type RobloxGame, normalizeGame } from './games';
import type { Script } from './scripts';
import {
  ChangelogRelease,
  INITIAL_CHANGELOG_RELEASES,
  normalizeChangelogRelease,
} from './changelog-utils';
import {
  readJson,
  writeJson,
  isSupabaseStorageConfigured,
} from './supabase-storage';
import {
  DEFAULT_LOADER_CODE,
  DEFAULT_LOADER_CONFIG,
  type UniversalLoaderConfig,
} from './loader-types';

export {
  DEFAULT_LOADER_CODE,
  DEFAULT_LOADER_CONFIG,
  type UniversalLoaderConfig,
  isSupabaseStorageConfigured,
};

// Authoritative object paths within the private Supabase Storage bucket
export const STORAGE_GAMES_PATH = 'nova-hub/games.json';
export const STORAGE_SCRIPTS_PATH = 'nova-hub/scripts.json';
export const STORAGE_LOADER_PATH = 'nova-hub/loader.json';
export const STORAGE_GAMES_MARKER_PATH = 'nova-hub/games-marker.json';
export const STORAGE_SCRIPTS_MARKER_PATH = 'nova-hub/scripts-marker.json';
export const STORAGE_SUGGESTIONS_PATH = 'nova-hub/suggestions.json';
export const STORAGE_CHANGELOG_PATH = 'nova-hub/changelog.json';
export const STORAGE_CHANGELOG_MARKER_PATH = 'nova-hub/changelog-marker.json';

// Legacy fallback paths for automatic migration from old sourhub/ namespace
export const LEGACY_STORAGE_GAMES_PATH = 'sourhub/games.json';
export const LEGACY_STORAGE_SCRIPTS_PATH = 'sourhub/scripts.json';
export const LEGACY_STORAGE_LOADER_PATH = 'sourhub/loader.json';
export const LEGACY_STORAGE_GAMES_MARKER_PATH = 'sourhub/games-marker.json';
export const LEGACY_STORAGE_SCRIPTS_MARKER_PATH = 'sourhub/scripts-marker.json';
export const LEGACY_STORAGE_SUGGESTIONS_PATH = 'sourhub/suggestions.json';
export const LEGACY_STORAGE_CHANGELOG_PATH = 'sourhub/changelog.json';
export const LEGACY_STORAGE_CHANGELOG_MARKER_PATH = 'sourhub/changelog-marker.json';

// In-memory cache for high-frequency public reads (5-second TTL)
let memoryGamesCache: { data: RobloxGame[]; timestamp: number } | null = null;
let memoryScriptsCache: { data: Script[]; timestamp: number } | null = null;
let memoryChangelogCache: { data: ChangelogRelease[]; timestamp: number } | null = null;
let memoryLoaderConfig: UniversalLoaderConfig | null = null;
let memorySuggestions: Suggestion[] = [];
const CACHE_TTL_MS = 5_000;

export function invalidateStorageCache(): void {
  memoryGamesCache = null;
  memoryScriptsCache = null;
  memoryChangelogCache = null;
  memoryLoaderConfig = null;
}

export interface StorageInitMarker {
  initialized: boolean;
  initializedAt: string;
  version: number;
}

export type SuggestionStatus = 'pending' | 'reviewed' | 'planned' | 'added' | 'rejected';

export interface Suggestion {
  id: string;
  gameName: string;
  robloxLink: string;
  suggestion: string;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt?: string;
}

async function markGamesStorageInitialized(): Promise<void> {
  const marker: StorageInitMarker = {
    initialized: true,
    initializedAt: new Date().toISOString(),
    version: 1,
  };
  await writeJson(STORAGE_GAMES_MARKER_PATH, marker);
}

async function markScriptsStorageInitialized(): Promise<void> {
  const marker: StorageInitMarker = {
    initialized: true,
    initializedAt: new Date().toISOString(),
    version: 1,
  };
  await writeJson(STORAGE_SCRIPTS_MARKER_PATH, marker);
}

/**
 * Get all stored games.
 * Authoritative source: Supabase Storage bucket ('nova-hub/games.json').
 * Games must NEVER be restored from demo or seed data.
 * If game storage has been initialized and its value is [], return []. Never repopulate it.
 * Once nova-hub/games-marker.json exists with initialized: true, NEVER read legacy games as fallback.
 */
export async function getStoredGames(options?: { forceFresh?: boolean }): Promise<RobloxGame[]> {
  if (!options?.forceFresh && memoryGamesCache && Date.now() - memoryGamesCache.timestamp < CACHE_TTL_MS) {
    return memoryGamesCache.data;
  }

  try {
    // 1. Check if authoritative nova-hub game storage has already been initialized
    const marker = await readJson<StorageInitMarker>(STORAGE_GAMES_MARKER_PATH);
    if (marker?.initialized) {
      // Once initialized: nova-hub/games.json is the sole authoritative collection.
      // If initialized and value is [], return []. Never repopulate or fallback to legacy games.
      const fromStorage = await readJson<RobloxGame[]>(STORAGE_GAMES_PATH);
      if (Array.isArray(fromStorage)) {
        const normalized = fromStorage.map((g) => normalizeGame(g));
        memoryGamesCache = { data: normalized, timestamp: Date.now() };
        return normalized;
      }
      // If marker is set but object was empty or missing, empty array [] is authoritative
      memoryGamesCache = { data: [], timestamp: Date.now() };
      return [];
    }

    // 2. Game storage has genuinely never been initialized under nova-hub.
    // Legacy migration may happen ONLY if game storage has genuinely never been initialized.
    const legacyMarker = await readJson<StorageInitMarker>(LEGACY_STORAGE_GAMES_MARKER_PATH);
    if (!legacyMarker?.initialized) {
      const legacyGames = await readJson<RobloxGame[]>(LEGACY_STORAGE_GAMES_PATH);
      if (Array.isArray(legacyGames) && legacyGames.length > 0) {
        console.info(`[Storage Migration] Migrating ${legacyGames.length} games from ${LEGACY_STORAGE_GAMES_PATH} to ${STORAGE_GAMES_PATH}...`);
        const normalized = legacyGames.map((g) => normalizeGame(g));
        await writeJson(STORAGE_GAMES_PATH, normalized);
        await markGamesStorageInitialized();
        memoryGamesCache = { data: normalized, timestamp: Date.now() };
        return normalized;
      }
    }

    // 3. Initial first-ever setup of empty games store to Supabase Storage
    const emptyGames: RobloxGame[] = [];
    await writeJson(STORAGE_GAMES_PATH, emptyGames);
    await markGamesStorageInitialized();
    console.info('[Storage] Initialized empty game storage in Supabase Storage.');

    memoryGamesCache = { data: emptyGames, timestamp: Date.now() };
    return emptyGames;
  } catch (err: any) {
    console.error(`[Storage] Error retrieving games from ${STORAGE_GAMES_PATH}:`, err?.message || err);
    if (memoryGamesCache?.data) return memoryGamesCache.data;
    return [];
  }
}

/**
 * Persistently save games to Supabase Storage.
 * Throws an error if Supabase Storage write fails or cannot be verified.
 */
export async function saveStoredGames(games: RobloxGame[]): Promise<void> {
  memoryGamesCache = null;
  await writeJson(STORAGE_GAMES_PATH, games);
  await markGamesStorageInitialized();
  const verified = await readJson<RobloxGame[]>(STORAGE_GAMES_PATH);
  if (!Array.isArray(verified)) {
    throw new Error('[Storage] Failed to verify persistent games storage.');
  }
  memoryGamesCache = { data: verified, timestamp: Date.now() };
  console.info(`[Storage] Persisted and verified ${verified.length} games in Supabase Storage.`);
}

/**
 * Get all stored scripts.
 * Authoritative source: Supabase Storage bucket ('nova-hub/scripts.json').
 * Scripts must NEVER be restored from data/scripts.json.
 * If script storage has been initialized and its value is [], return []. Never repopulate it.
 * Once nova-hub/scripts-marker.json exists with initialized: true, NEVER read legacy scripts as fallback.
 */
export async function getStoredScripts(options?: { forceFresh?: boolean }): Promise<Script[]> {
  if (!options?.forceFresh && memoryScriptsCache && Date.now() - memoryScriptsCache.timestamp < CACHE_TTL_MS) {
    return memoryScriptsCache.data;
  }

  try {
    // 1. Check if authoritative nova-hub script storage has already been initialized
    const marker = await readJson<StorageInitMarker>(STORAGE_SCRIPTS_MARKER_PATH);
    if (marker?.initialized) {
      // Once initialized: nova-hub/scripts.json is the sole authoritative collection.
      // If initialized and value is [], return []. Never repopulate or fallback to legacy scripts.
      const fromStorage = await readJson<Script[]>(STORAGE_SCRIPTS_PATH);
      if (Array.isArray(fromStorage)) {
        memoryScriptsCache = { data: fromStorage, timestamp: Date.now() };
        return fromStorage;
      }
      // If marker is set but object was empty or missing, empty array [] is authoritative
      memoryScriptsCache = { data: [], timestamp: Date.now() };
      return [];
    }

    // 2. Script storage has genuinely never been initialized under nova-hub.
    // Legacy migration may happen ONLY if script storage has genuinely never been initialized.
    const legacyMarker = await readJson<StorageInitMarker>(LEGACY_STORAGE_SCRIPTS_MARKER_PATH);
    if (!legacyMarker?.initialized) {
      const legacyScripts = await readJson<Script[]>(LEGACY_STORAGE_SCRIPTS_PATH);
      if (Array.isArray(legacyScripts) && legacyScripts.length > 0) {
        console.info(`[Storage Migration] Migrating ${legacyScripts.length} scripts from ${LEGACY_STORAGE_SCRIPTS_PATH} to ${STORAGE_SCRIPTS_PATH}...`);
        await writeJson(STORAGE_SCRIPTS_PATH, legacyScripts);
        await markScriptsStorageInitialized();
        memoryScriptsCache = { data: legacyScripts, timestamp: Date.now() };
        return legacyScripts;
      }
    }

    // 3. Initial first-ever setup of empty scripts store to Supabase Storage
    const emptyScripts: Script[] = [];
    await writeJson(STORAGE_SCRIPTS_PATH, emptyScripts);
    await markScriptsStorageInitialized();
    console.info('[Storage] Initialized empty script storage in Supabase Storage.');

    memoryScriptsCache = { data: emptyScripts, timestamp: Date.now() };
    return emptyScripts;
  } catch (err: any) {
    console.error(`[Storage] Error retrieving scripts from ${STORAGE_SCRIPTS_PATH}:`, err?.message || err);
    if (memoryScriptsCache?.data) return memoryScriptsCache.data;
    return [];
  }
}

/**
 * Persistently save scripts to Supabase Storage.
 * Writes complete updated scripts, verifies the write succeeded, and throws if persistence fails.
 */
export async function saveStoredScripts(scripts: Script[]): Promise<void> {
  // Invalidate any stale in-memory read cache before saving
  memoryScriptsCache = null;

  // Write complete collection to persistent Supabase Storage
  await writeJson(STORAGE_SCRIPTS_PATH, scripts);
  await markScriptsStorageInitialized();

  // Verify write succeeded by reading back from storage
  const verified = await readJson<Script[]>(STORAGE_SCRIPTS_PATH);
  if (!Array.isArray(verified)) {
    throw new Error('[Storage] Persistence verification failed: scripts were not stored correctly in Supabase Storage.');
  }

  memoryScriptsCache = { data: verified, timestamp: Date.now() };
  console.info(`[Storage] Persisted and verified ${verified.length} scripts in Supabase Storage.`);
}

/**
 * Get Universal Loader configuration.
 * Stored persistently in private Supabase Storage ('nova-hub/loader.json').
 * Automatically migrates existing configuration from legacy 'sourhub/loader.json'.
 */
export async function getStoredLoaderConfig(): Promise<UniversalLoaderConfig> {
  if (!isSupabaseStorageConfigured()) {
    return memoryLoaderConfig || DEFAULT_LOADER_CONFIG;
  }

  try {
    let fromStorage = await readJson<UniversalLoaderConfig>(STORAGE_LOADER_PATH);

    // If not found at new path, check legacy path for migration
    if (!fromStorage || typeof fromStorage.code !== 'string') {
      const legacyConfig = await readJson<UniversalLoaderConfig>(LEGACY_STORAGE_LOADER_PATH);
      if (legacyConfig && typeof legacyConfig.code === 'string') {
        console.info(`[Storage Migration] Migrated Universal Loader config from ${LEGACY_STORAGE_LOADER_PATH} to ${STORAGE_LOADER_PATH}`);
        fromStorage = legacyConfig;
        await writeJson(STORAGE_LOADER_PATH, legacyConfig);
      }
    }

    if (fromStorage && typeof fromStorage.code === 'string') {
      let currentCode = fromStorage.code;
      let currentVersion = fromStorage.version || DEFAULT_LOADER_CONFIG.version;

      // Ensure execution telemetry tracking endpoint is present
      if (!currentCode.includes('/api/executions')) {
        currentCode = DEFAULT_LOADER_CODE;
        currentVersion = '2.5.0';
        writeJson(STORAGE_LOADER_PATH, {
          ...fromStorage,
          code: currentCode,
          version: currentVersion,
        }).catch((err) => {
          console.warn('[Storage] Could not update loader code with telemetry:', err);
        });
      }

      const resolved = {
        code: currentCode,
        version: currentVersion,
        enabled: fromStorage.enabled !== undefined ? Boolean(fromStorage.enabled) : true,
        updatedAt: fromStorage.updatedAt || DEFAULT_LOADER_CONFIG.updatedAt,
      };
      memoryLoaderConfig = resolved;
      return resolved;
    }

    // Seed default loader configuration to Supabase Storage on first access
    try {
      await writeJson(STORAGE_LOADER_PATH, DEFAULT_LOADER_CONFIG);
      console.info('[Storage] Seeded default Universal Loader to Supabase Storage.');
    } catch (err) {
      console.warn('[Storage] Failed seeding default Universal Loader:', err);
    }

    return DEFAULT_LOADER_CONFIG;
  } catch (err: any) {
    console.error(`[Storage] Error reading loader config from ${STORAGE_LOADER_PATH}:`, err?.message || err);
    return memoryLoaderConfig || DEFAULT_LOADER_CONFIG;
  }
}

/**
 * Persistently save Universal Loader configuration to Supabase Storage.
 */
export async function saveStoredLoaderConfig(config: UniversalLoaderConfig): Promise<void> {
  memoryLoaderConfig = config;
  if (!isSupabaseStorageConfigured()) {
    console.warn('[Storage] Supabase Storage not configured — loader config saved to memory.');
    return;
  }
  await writeJson(STORAGE_LOADER_PATH, config);
  console.info('[Storage] Persisted Universal Loader config to Supabase Storage.');
}

/**
 * Retrieve all user suggestions from Supabase Storage ('nova-hub/suggestions.json').
 * Automatically migrates existing suggestions from legacy 'sourhub/suggestions.json'.
 */
export async function getStoredSuggestions(): Promise<Suggestion[]> {
  if (!isSupabaseStorageConfigured()) {
    return memorySuggestions;
  }

  try {
    let fromStorage = await readJson<Suggestion[]>(STORAGE_SUGGESTIONS_PATH);

    // If not found at new path, check legacy path for migration
    if (!Array.isArray(fromStorage)) {
      const legacySuggestions = await readJson<Suggestion[]>(LEGACY_STORAGE_SUGGESTIONS_PATH);
      if (Array.isArray(legacySuggestions) && legacySuggestions.length > 0) {
        console.info(`[Storage Migration] Migrated ${legacySuggestions.length} suggestions from ${LEGACY_STORAGE_SUGGESTIONS_PATH} to ${STORAGE_SUGGESTIONS_PATH}`);
        fromStorage = legacySuggestions;
        await writeJson(STORAGE_SUGGESTIONS_PATH, legacySuggestions);
      }
    }

    if (Array.isArray(fromStorage)) {
      memorySuggestions = fromStorage;
      return fromStorage;
    }
    return [];
  } catch (err: any) {
    console.error(`[Storage] Error reading suggestions from ${STORAGE_SUGGESTIONS_PATH}:`, err?.message || err);
    return memorySuggestions || [];
  }
}

/**
 * Persistently save all suggestions to Supabase Storage.
 */
export async function saveStoredSuggestions(suggestions: Suggestion[]): Promise<void> {
  memorySuggestions = suggestions;
  if (!isSupabaseStorageConfigured()) {
    console.warn('[Storage] Supabase Storage not configured — suggestions saved to memory.');
    return;
  }
  await writeJson(STORAGE_SUGGESTIONS_PATH, suggestions);
  console.info(`[Storage] Persisted ${suggestions.length} suggestions to Supabase Storage.`);
}

/**
 * Retrieve all changelog releases from Supabase Storage ('nova-hub/changelog.json').
 * Automatically migrates existing changelog from legacy 'sourhub/changelog.json'.
 */
export async function getStoredChangelog(options?: { forceFresh?: boolean }): Promise<ChangelogRelease[]> {
  if (!isSupabaseStorageConfigured()) {
    if (!options?.forceFresh && memoryChangelogCache) {
      return memoryChangelogCache.data;
    }
    const seed = INITIAL_CHANGELOG_RELEASES.map(normalizeChangelogRelease);
    memoryChangelogCache = { data: seed, timestamp: Date.now() };
    return seed;
  }

  if (!options?.forceFresh && memoryChangelogCache && Date.now() - memoryChangelogCache.timestamp < CACHE_TTL_MS) {
    return memoryChangelogCache.data;
  }

  try {
    let fromStorage = await readJson<ChangelogRelease[]>(STORAGE_CHANGELOG_PATH);

    // If not found at new path, check legacy path for migration
    if (!Array.isArray(fromStorage)) {
      const legacyChangelog = await readJson<ChangelogRelease[]>(LEGACY_STORAGE_CHANGELOG_PATH);
      if (Array.isArray(legacyChangelog) && legacyChangelog.length > 0) {
        console.info(`[Storage Migration] Migrated ${legacyChangelog.length} changelog releases from ${LEGACY_STORAGE_CHANGELOG_PATH} to ${STORAGE_CHANGELOG_PATH}`);
        fromStorage = legacyChangelog;
        await writeJson(STORAGE_CHANGELOG_PATH, legacyChangelog);
        await writeJson(STORAGE_CHANGELOG_MARKER_PATH, {
          initialized: true,
          initializedAt: new Date().toISOString(),
          version: 1,
        });
      }
    }

    if (Array.isArray(fromStorage)) {
      const normalized = fromStorage.map(normalizeChangelogRelease);
      memoryChangelogCache = { data: normalized, timestamp: Date.now() };
      return normalized;
    }

    // Check if persistent storage was already initialized previously
    const marker = await readJson<StorageInitMarker>(STORAGE_CHANGELOG_MARKER_PATH);
    const legacyMarker = !marker?.initialized ? await readJson<StorageInitMarker>(LEGACY_STORAGE_CHANGELOG_MARKER_PATH) : null;
    if (marker?.initialized || legacyMarker?.initialized) {
      memoryChangelogCache = { data: [], timestamp: Date.now() };
      return [];
    }

    // Initial first-ever seed to Supabase Storage
    const seed = INITIAL_CHANGELOG_RELEASES.map(normalizeChangelogRelease);
    await writeJson(STORAGE_CHANGELOG_PATH, seed);
    await writeJson(STORAGE_CHANGELOG_MARKER_PATH, {
      initialized: true,
      initializedAt: new Date().toISOString(),
      version: 1,
    });
    console.info(`[Storage] Seeded ${seed.length} changelog releases to Supabase Storage.`);

    memoryChangelogCache = { data: seed, timestamp: Date.now() };
    return seed;
  } catch (err: any) {
    console.error(`[Storage] Error reading changelog from ${STORAGE_CHANGELOG_PATH}:`, err?.message || err);
    if (memoryChangelogCache?.data) return memoryChangelogCache.data;
    const seed = INITIAL_CHANGELOG_RELEASES.map(normalizeChangelogRelease);
    return seed;
  }
}

/**
 * Persistently save changelog releases to Supabase Storage.
 */
export async function saveStoredChangelog(releases: ChangelogRelease[]): Promise<void> {
  const normalized = releases.map(normalizeChangelogRelease);
  memoryChangelogCache = { data: normalized, timestamp: Date.now() };
  if (!isSupabaseStorageConfigured()) {
    console.warn('[Storage] Supabase Storage not configured — changelog saved to memory.');
    return;
  }
  await writeJson(STORAGE_CHANGELOG_PATH, normalized);
  await writeJson(STORAGE_CHANGELOG_MARKER_PATH, {
    initialized: true,
    initializedAt: new Date().toISOString(),
    version: 1,
  });
  console.info(`[Storage] Persisted ${normalized.length} changelog releases to Supabase Storage.`);
}
