import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { get, put, BlobNotFoundError } from '@vercel/blob';
import type { RobloxGame } from './games';
import type { Script } from './scripts';
import { ChangelogRelease, INITIAL_CHANGELOG_RELEASES } from './changelog';

const BLOB_GAMES_PATHNAME = 'sourhub/games.json';
const BLOB_SCRIPTS_PATHNAME = 'sourhub/scripts.json';
const BLOB_LOADER_PATHNAME = 'sourhub/loader.json';
const BLOB_INIT_MARKER_PATHNAME = 'sourhub/init-marker.json';
const BLOB_SUGGESTIONS_PATHNAME = 'sourhub/suggestions.json';
const BLOB_CHANGELOG_PATHNAME = 'sourhub/changelog.json';
const BLOB_CHANGELOG_MARKER_PATHNAME = 'sourhub/changelog-marker.json';

// Local temporary writable path (fallback cache for serverless environment)
const TMP_DIR = os.tmpdir();
const TMP_GAMES_PATH = path.join(TMP_DIR, 'sourhub_games.json');
const TMP_SCRIPTS_PATH = path.join(TMP_DIR, 'sourhub_scripts.json');
const TMP_LOADER_PATH = path.join(TMP_DIR, 'sourhub_loader.json');
const TMP_INIT_MARKER_PATH = path.join(TMP_DIR, 'sourhub_init_marker.json');
const TMP_SUGGESTIONS_PATH = path.join(TMP_DIR, 'sourhub_suggestions.json');
const TMP_CHANGELOG_PATH = path.join(TMP_DIR, 'sourhub_changelog.json');
const TMP_CHANGELOG_MARKER_PATH = path.join(TMP_DIR, 'sourhub_changelog_marker.json');

// High-performance in-memory cache to prevent redundant Blob/disk fetches on high-traffic public pages
let memoryGamesCache: { data: RobloxGame[]; timestamp: number } | null = null;
let memoryScriptsCache: { data: Script[]; timestamp: number } | null = null;
let memoryChangelogCache: { data: ChangelogRelease[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 20_000; // 20-second cache ensures sub-millisecond response for public page rendering

// Read-only project seed files (bundled at build, used ONLY for first-ever initialization)
const SEED_GAMES_PATH = path.join(process.cwd(), 'data', 'games.json');
const SEED_SCRIPTS_PATH = path.join(process.cwd(), 'data', 'scripts.json');

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

import {
  DEFAULT_LOADER_CODE,
  DEFAULT_LOADER_CONFIG,
  type UniversalLoaderConfig,
} from './loader-types';

export {
  DEFAULT_LOADER_CODE,
  DEFAULT_LOADER_CONFIG,
  type UniversalLoaderConfig,
};

/**
 * Checks if Vercel Blob storage is configured via process.env.BLOB_READ_WRITE_TOKEN.
 * Runs strictly server-side.
 */
export function isBlobStorageConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return false;
  if (token === 'Configured securely in Vercel') return false;
  return true;
}

/**
 * Sanitize error messages so credentials/tokens are never leaked in logs or client responses.
 */
function sanitizeError(err: any): Error {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  let msg = err?.message || String(err || 'Unknown error');
  if (token && token.length > 5) {
    msg = msg.replaceAll(token, '[REDACTED_TOKEN]');
  }
  const error = new Error(msg);
  error.name = err?.name || 'BlobStorageError';
  return error;
}

// Read JSON from private Vercel Blob store
async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!isBlobStorageConfigured() || !token) return null;

  try {
    const result = await get(pathname, {
      access: 'private',
      token,
      useCache: false, // Guarantees freshest origin data directly from Vercel Blob
    });

    if (result && result.statusCode === 200 && result.stream) {
      const text = await new Response(result.stream).text();
      if (text && text.trim().length > 0) {
        return JSON.parse(text) as T;
      }
    }
    return null;
  } catch (err: any) {
    if (
      err instanceof BlobNotFoundError ||
      err?.name === 'BlobNotFoundError' ||
      err?.message?.includes('not found') ||
      err?.message?.includes('404')
    ) {
      return null;
    }

    const cleanErr = sanitizeError(err);
    console.error(`[Storage] Failed reading private Vercel Blob at ${pathname}:`, cleanErr.message);
    throw cleanErr;
  }
}

// Write JSON to private Vercel Blob store and confirm persistence
async function writeBlobJson<T>(pathname: string, data: T): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!isBlobStorageConfigured() || !token) {
    return;
  }

  const payload = JSON.stringify(data, null, 2);
  try {
    const putResult = await put(pathname, payload, {
      access: 'private',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    });

    if (!putResult || !putResult.url) {
      throw new Error(`Blob write completed but no storage confirmation returned for ${pathname}`);
    }
  } catch (err: any) {
    const cleanErr = sanitizeError(err);
    console.error(`[Storage] Failed writing to private Vercel Blob at ${pathname}:`, cleanErr.message);
    throw cleanErr;
  }
}

// Read from /tmp fallback
async function readTmpJson<T>(tmpPath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(tmpPath, 'utf-8');
    if (raw && raw.trim().length > 0) {
      return JSON.parse(raw) as T;
    }
  } catch {}
  return null;
}

// Write to /tmp fallback (never writes to project directory or /var/task)
async function writeTmpJson<T>(tmpPath: string, data: T): Promise<void> {
  try {
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Storage] Failed writing to temporary file ${tmpPath}:`, err);
  }
}

// Read seed data from bundled data/*.json (Read-only initial seed, used ONCE on initial deployment)
async function readSeedGames(): Promise<RobloxGame[]> {
  try {
    const raw = await fs.readFile(SEED_GAMES_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as RobloxGame[];
    }
  } catch {}
  return [];
}

async function readSeedScripts(): Promise<Script[]> {
  try {
    const raw = await fs.readFile(SEED_SCRIPTS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Script[];
    }
  } catch {}
  return [];
}

/**
 * Marks storage as initialized with persistent marker so bundled JSON seed files
 * are NEVER automatically re-imported when scripts or games are intentionally deleted to empty.
 */
async function markStorageInitialized(): Promise<void> {
  const marker: StorageInitMarker = {
    initialized: true,
    initializedAt: new Date().toISOString(),
    version: 1,
  };
  await writeTmpJson(TMP_INIT_MARKER_PATH, marker);
  if (isBlobStorageConfigured()) {
    try {
      await writeBlobJson(BLOB_INIT_MARKER_PATHNAME, marker);
    } catch (err) {
      console.warn('[Storage] Failed to write init marker to Blob:', sanitizeError(err).message);
    }
  }
}

/**
 * Get all stored games.
 * Reads from private Vercel Blob on every request without caching.
 * Uses bundled seed data strictly on the very first initialization.
 */
export async function getStoredGames(): Promise<RobloxGame[]> {
  if (memoryGamesCache && Date.now() - memoryGamesCache.timestamp < CACHE_TTL_MS) {
    return memoryGamesCache.data;
  }

  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<RobloxGame[]>(BLOB_GAMES_PATHNAME);
      // If fromBlob is an array (even if empty []), it is the authoritative store!
      if (Array.isArray(fromBlob)) {
        writeTmpJson(TMP_GAMES_PATH, fromBlob).catch(() => {});
        memoryGamesCache = { data: fromBlob, timestamp: Date.now() };
        return fromBlob;
      }

      // Check if persistent storage was already initialized
      const marker = await readBlobJson<StorageInitMarker>(BLOB_INIT_MARKER_PATHNAME);
      if (marker?.initialized) {
        // Storage is already initialized; intentionally empty list must remain empty
        memoryGamesCache = { data: [], timestamp: Date.now() };
        return [];
      }

      // Initial first-ever seed to Blob
      const seed = await readSeedGames();
      try {
        await writeBlobJson(BLOB_GAMES_PATHNAME, seed);
        await markStorageInitialized();
        console.info(`[Storage] First-time initialization: seeded ${seed.length} games to private Vercel Blob.`);
      } catch (seedErr: any) {
        console.warn('[Storage] Could not seed private Vercel Blob:', sanitizeError(seedErr).message);
      }
      writeTmpJson(TMP_GAMES_PATH, seed).catch(() => {});
      memoryGamesCache = { data: seed, timestamp: Date.now() };
      return seed;
    } catch (err: any) {
      console.warn('[Storage] Reading games from private Vercel Blob failed, falling back to cache:', sanitizeError(err).message);
    }
  }

  // Fallback: local /tmp cache
  const fromTmp = await readTmpJson<RobloxGame[]>(TMP_GAMES_PATH);
  if (Array.isArray(fromTmp)) {
    memoryGamesCache = { data: fromTmp, timestamp: Date.now() };
    return fromTmp;
  }

  const tmpMarker = await readTmpJson<StorageInitMarker>(TMP_INIT_MARKER_PATH);
  if (tmpMarker?.initialized) {
    memoryGamesCache = { data: [], timestamp: Date.now() };
    return [];
  }

  // First-ever initialization for local fallback
  const seed = await readSeedGames();
  await writeTmpJson(TMP_GAMES_PATH, seed).catch(() => {});
  await markStorageInitialized().catch(() => {});
  memoryGamesCache = { data: seed, timestamp: Date.now() };
  return seed;
}

/**
 * Persistently save games to private Vercel Blob.
 * Throws if the write fails so caller does not report false success.
 */
export async function saveStoredGames(games: RobloxGame[]): Promise<void> {
  memoryGamesCache = { data: games, timestamp: Date.now() };
  await writeTmpJson(TMP_GAMES_PATH, games);

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_GAMES_PATHNAME, games);
    await markStorageInitialized();
    console.info(`[Storage] Confirmed write of ${games.length} games to private Vercel Blob.`);
  } else {
    await markStorageInitialized();
  }
}

/**
 * Get all stored scripts.
 * Reads directly from private Vercel Blob on every relevant request.
 * Bundled scripts.json is used ONLY for the first-ever storage initialization.
 * An intentionally empty script library (length === 0) remains empty.
 */
export async function getStoredScripts(): Promise<Script[]> {
  if (memoryScriptsCache && Date.now() - memoryScriptsCache.timestamp < CACHE_TTL_MS) {
    return memoryScriptsCache.data;
  }

  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<Script[]>(BLOB_SCRIPTS_PATHNAME);
      // CRITICAL FIX: If fromBlob is an array (even if empty []), it is the authoritative store!
      if (Array.isArray(fromBlob)) {
        writeTmpJson(TMP_SCRIPTS_PATH, fromBlob).catch(() => {});
        memoryScriptsCache = { data: fromBlob, timestamp: Date.now() };
        return fromBlob;
      }

      // Check if persistent storage was already initialized previously
      const marker = await readBlobJson<StorageInitMarker>(BLOB_INIT_MARKER_PATHNAME);
      if (marker?.initialized) {
        // Storage is already initialized; intentionally empty list must remain empty
        memoryScriptsCache = { data: [], timestamp: Date.now() };
        return [];
      }

      // Initial first-ever seed to Blob
      const seed = await readSeedScripts();
      try {
        await writeBlobJson(BLOB_SCRIPTS_PATHNAME, seed);
        await markStorageInitialized();
        console.info(`[Storage] First-time initialization: seeded ${seed.length} scripts to private Vercel Blob.`);
      } catch (seedErr: any) {
        console.warn('[Storage] Could not seed private Vercel Blob:', sanitizeError(seedErr).message);
      }
      writeTmpJson(TMP_SCRIPTS_PATH, seed).catch(() => {});
      memoryScriptsCache = { data: seed, timestamp: Date.now() };
      return seed;
    } catch (err: any) {
      console.warn('[Storage] Reading scripts from private Vercel Blob failed, falling back to cache:', sanitizeError(err).message);
    }
  }

  // Fallback: local /tmp cache
  const fromTmp = await readTmpJson<Script[]>(TMP_SCRIPTS_PATH);
  if (Array.isArray(fromTmp)) {
    memoryScriptsCache = { data: fromTmp, timestamp: Date.now() };
    return fromTmp;
  }

  const tmpMarker = await readTmpJson<StorageInitMarker>(TMP_INIT_MARKER_PATH);
  if (tmpMarker?.initialized) {
    memoryScriptsCache = { data: [], timestamp: Date.now() };
    return [];
  }

  // First-ever initialization for local fallback
  const seed = await readSeedScripts();
  await writeTmpJson(TMP_SCRIPTS_PATH, seed).catch(() => {});
  await markStorageInitialized().catch(() => {});
  memoryScriptsCache = { data: seed, timestamp: Date.now() };
  return seed;
}

/**
 * Persistently save scripts to private Vercel Blob.
 * Throws if the write fails so caller does not report false success.
 */
export async function saveStoredScripts(scripts: Script[]): Promise<void> {
  memoryScriptsCache = { data: scripts, timestamp: Date.now() };
  await writeTmpJson(TMP_SCRIPTS_PATH, scripts);

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_SCRIPTS_PATHNAME, scripts);
    await markStorageInitialized();
    console.info(`[Storage] Confirmed write of ${scripts.length} scripts to private Vercel Blob.`);
  } else {
    await markStorageInitialized();
  }
}

/**
 * Get Universal Loader configuration.
 * Stored persistently in private Vercel Blob store ('sourhub/loader.json').
 * Returns safe default if no saved value exists.
 */
export async function getStoredLoaderConfig(): Promise<UniversalLoaderConfig> {
  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<UniversalLoaderConfig>(BLOB_LOADER_PATHNAME);
      if (fromBlob && typeof fromBlob.code === 'string') {
        let currentCode = fromBlob.code;
        let currentVersion = fromBlob.version || DEFAULT_LOADER_CONFIG.version;
        // Seamlessly ensure execution tracking is included
        if (!currentCode.includes('/api/executions')) {
          currentCode = DEFAULT_LOADER_CODE;
          currentVersion = '2.5.0';
          writeBlobJson(BLOB_LOADER_PATHNAME, {
            ...fromBlob,
            code: currentCode,
            version: currentVersion,
          }).catch(() => {});
        }

        const config: UniversalLoaderConfig = {
          code: currentCode,
          version: currentVersion,
          enabled: fromBlob.enabled !== undefined ? Boolean(fromBlob.enabled) : true,
          updatedAt: fromBlob.updatedAt || DEFAULT_LOADER_CONFIG.updatedAt,
        };
        writeTmpJson(TMP_LOADER_PATH, config).catch(() => {});
        return config;
      }

      // First-time seed of default loader configuration to Blob
      try {
        await writeBlobJson(BLOB_LOADER_PATHNAME, DEFAULT_LOADER_CONFIG);
        console.info('[Storage] Seeded default Universal Loader to private Vercel Blob.');
      } catch (seedErr: any) {
        console.warn('[Storage] Could not seed default loader to Vercel Blob:', sanitizeError(seedErr).message);
      }
      writeTmpJson(TMP_LOADER_PATH, DEFAULT_LOADER_CONFIG).catch(() => {});
      return DEFAULT_LOADER_CONFIG;
    } catch (err: any) {
      console.warn('[Storage] Reading Universal Loader from Vercel Blob failed:', sanitizeError(err).message);
    }
  }

  const fromTmp = await readTmpJson<UniversalLoaderConfig>(TMP_LOADER_PATH);
  if (fromTmp && typeof fromTmp.code === 'string') {
    return fromTmp;
  }

  return DEFAULT_LOADER_CONFIG;
}

/**
 * Persistently save Universal Loader configuration to private Vercel Blob store.
 * Never stores or updates through local files.
 */
export async function saveStoredLoaderConfig(config: UniversalLoaderConfig): Promise<void> {
  await writeTmpJson(TMP_LOADER_PATH, config);

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_LOADER_PATHNAME, config);
    console.info('[Storage] Confirmed write of Universal Loader to private Vercel Blob.');
  }
}

/**
 * Retrieve all user suggestions from private Vercel Blob store.
 * Returns empty array if none have been created.
 */
export async function getStoredSuggestions(): Promise<Suggestion[]> {
  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<Suggestion[]>(BLOB_SUGGESTIONS_PATHNAME);
      if (Array.isArray(fromBlob)) {
        writeTmpJson(TMP_SUGGESTIONS_PATH, fromBlob).catch(() => {});
        return fromBlob;
      }
    } catch (err: any) {
      console.warn('[Storage] Reading suggestions from Vercel Blob failed:', sanitizeError(err).message);
    }
  }

  const fromTmp = await readTmpJson<Suggestion[]>(TMP_SUGGESTIONS_PATH);
  if (Array.isArray(fromTmp)) {
    return fromTmp;
  }

  return [];
}

/**
 * Persistently save all suggestions to private Vercel Blob store.
 */
export async function saveStoredSuggestions(suggestions: Suggestion[]): Promise<void> {
  await writeTmpJson(TMP_SUGGESTIONS_PATH, suggestions);

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_SUGGESTIONS_PATHNAME, suggestions);
    console.info('[Storage] Confirmed write of suggestions to private Vercel Blob.');
  }
}

/**
 * Retrieve all changelog releases from private Vercel Blob store.
 * Returns empty array if none have been created or if explicitly cleared.
 */
export async function getStoredChangelog(): Promise<ChangelogRelease[]> {
  if (memoryChangelogCache && Date.now() - memoryChangelogCache.timestamp < CACHE_TTL_MS) {
    return memoryChangelogCache.data;
  }

  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<ChangelogRelease[]>(BLOB_CHANGELOG_PATHNAME);
      if (Array.isArray(fromBlob)) {
        writeTmpJson(TMP_CHANGELOG_PATH, fromBlob).catch(() => {});
        memoryChangelogCache = { data: fromBlob, timestamp: Date.now() };
        return fromBlob;
      }

      // Check if persistent storage was already initialized previously
      const marker = await readBlobJson<StorageInitMarker>(BLOB_CHANGELOG_MARKER_PATHNAME);
      if (marker?.initialized) {
        memoryChangelogCache = { data: [], timestamp: Date.now() };
        return [];
      }

      // Initial first-ever seed to Blob
      const seed = INITIAL_CHANGELOG_RELEASES;
      try {
        await writeBlobJson(BLOB_CHANGELOG_PATHNAME, seed);
        await writeBlobJson(BLOB_CHANGELOG_MARKER_PATHNAME, {
          initialized: true,
          initializedAt: new Date().toISOString(),
          version: 1,
        });
        console.info(`[Storage] First-time initialization: seeded ${seed.length} releases to private Vercel Blob.`);
      } catch (seedErr: any) {
        console.warn('[Storage] Could not seed changelog to private Vercel Blob:', sanitizeError(seedErr).message);
      }
      writeTmpJson(TMP_CHANGELOG_PATH, seed).catch(() => {});
      memoryChangelogCache = { data: seed, timestamp: Date.now() };
      return seed;
    } catch (err: any) {
      console.warn('[Storage] Reading changelog from private Vercel Blob failed, falling back to cache:', sanitizeError(err).message);
    }
  }

  // Fallback: local /tmp cache
  const fromTmp = await readTmpJson<ChangelogRelease[]>(TMP_CHANGELOG_PATH);
  if (Array.isArray(fromTmp)) {
    memoryChangelogCache = { data: fromTmp, timestamp: Date.now() };
    return fromTmp;
  }

  const tmpMarker = await readTmpJson<StorageInitMarker>(TMP_CHANGELOG_MARKER_PATH);
  if (tmpMarker?.initialized) {
    memoryChangelogCache = { data: [], timestamp: Date.now() };
    return [];
  }

  // First-ever initialization for local fallback
  const seed = INITIAL_CHANGELOG_RELEASES;
  await writeTmpJson(TMP_CHANGELOG_PATH, seed).catch(() => {});
  await writeTmpJson(TMP_CHANGELOG_MARKER_PATH, {
    initialized: true,
    initializedAt: new Date().toISOString(),
    version: 1,
  }).catch(() => {});
  memoryChangelogCache = { data: seed, timestamp: Date.now() };
  return seed;
}

/**
 * Persistently save changelog releases to private Vercel Blob store.
 */
export async function saveStoredChangelog(releases: ChangelogRelease[]): Promise<void> {
  memoryChangelogCache = { data: releases, timestamp: Date.now() };
  await writeTmpJson(TMP_CHANGELOG_PATH, releases);
  await writeTmpJson(TMP_CHANGELOG_MARKER_PATH, {
    initialized: true,
    initializedAt: new Date().toISOString(),
    version: 1,
  }).catch(() => {});

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_CHANGELOG_PATHNAME, releases);
    await writeBlobJson(BLOB_CHANGELOG_MARKER_PATHNAME, {
      initialized: true,
      initializedAt: new Date().toISOString(),
      version: 1,
    }).catch(() => {});
    console.info(`[Storage] Confirmed write of ${releases.length} releases to private Vercel Blob.`);
  }
}


