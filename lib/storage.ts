import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { get, put, BlobNotFoundError } from '@vercel/blob';
import type { RobloxGame } from './games';
import type { Script } from './scripts';

const BLOB_GAMES_PATHNAME = 'sourhub/games.json';
const BLOB_SCRIPTS_PATHNAME = 'sourhub/scripts.json';

// Local temporary writable path (fallback cache for serverless environment)
const TMP_DIR = os.tmpdir();
const TMP_GAMES_PATH = path.join(TMP_DIR, 'sourhub_games.json');
const TMP_SCRIPTS_PATH = path.join(TMP_DIR, 'sourhub_scripts.json');

// Read-only project seed files (bundled at build, NEVER written to)
const SEED_GAMES_PATH = path.join(process.cwd(), 'data', 'games.json');
const SEED_SCRIPTS_PATH = path.join(process.cwd(), 'data', 'scripts.json');

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

// Read seed data from bundled data/*.json (Read-only initial seed)
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
 * Get all stored games.
 * Reads from private Vercel Blob on every relevant request.
 * If Blob is empty, seeds once from bundled games.json.
 */
export async function getStoredGames(): Promise<RobloxGame[]> {
  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<RobloxGame[]>(BLOB_GAMES_PATHNAME);
      if (Array.isArray(fromBlob) && fromBlob.length > 0) {
        writeTmpJson(TMP_GAMES_PATH, fromBlob).catch(() => {});
        return fromBlob;
      }

      // Initial seed to Blob if store is empty
      const seed = await readSeedGames();
      if (seed.length > 0) {
        try {
          await writeBlobJson(BLOB_GAMES_PATHNAME, seed);
          console.info(`[Storage] Seeded ${seed.length} initial games to private Vercel Blob.`);
        } catch (seedErr: any) {
          console.warn('[Storage] Could not seed private Vercel Blob:', sanitizeError(seedErr).message);
        }
        writeTmpJson(TMP_GAMES_PATH, seed).catch(() => {});
        return seed;
      }
    } catch (err: any) {
      console.warn('[Storage] Reading games from private Vercel Blob failed, falling back to cache:', sanitizeError(err).message);
    }
  }

  // Fallback: local /tmp cache or bundled seed data
  const fromTmp = await readTmpJson<RobloxGame[]>(TMP_GAMES_PATH);
  if (Array.isArray(fromTmp) && fromTmp.length > 0) {
    return fromTmp;
  }

  const seed = await readSeedGames();
  if (seed.length > 0) {
    await writeTmpJson(TMP_GAMES_PATH, seed).catch(() => {});
  }
  return seed;
}

/**
 * Persistently save games to private Vercel Blob.
 * Throws if the write fails so caller does not report false success.
 */
export async function saveStoredGames(games: RobloxGame[]): Promise<void> {
  // Always update ephemeral cache for immediate consistency
  await writeTmpJson(TMP_GAMES_PATH, games);

  // If Vercel Blob is configured, save persistently with access: "private"
  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_GAMES_PATHNAME, games);
    console.info(`[Storage] Confirmed write of ${games.length} games to private Vercel Blob.`);
  }
}

/**
 * Get all stored scripts.
 * Reads from private Vercel Blob on every relevant request.
 * If Blob is empty, seeds once from bundled scripts.json.
 */
export async function getStoredScripts(): Promise<Script[]> {
  if (isBlobStorageConfigured()) {
    try {
      const fromBlob = await readBlobJson<Script[]>(BLOB_SCRIPTS_PATHNAME);
      if (Array.isArray(fromBlob) && fromBlob.length > 0) {
        writeTmpJson(TMP_SCRIPTS_PATH, fromBlob).catch(() => {});
        return fromBlob;
      }

      // Initial seed to Blob if store is empty
      const seed = await readSeedScripts();
      if (seed.length > 0) {
        try {
          await writeBlobJson(BLOB_SCRIPTS_PATHNAME, seed);
          console.info(`[Storage] Seeded ${seed.length} initial scripts to private Vercel Blob.`);
        } catch (seedErr: any) {
          console.warn('[Storage] Could not seed private Vercel Blob:', sanitizeError(seedErr).message);
        }
        writeTmpJson(TMP_SCRIPTS_PATH, seed).catch(() => {});
        return seed;
      }
    } catch (err: any) {
      console.warn('[Storage] Reading scripts from private Vercel Blob failed, falling back to cache:', sanitizeError(err).message);
    }
  }

  const fromTmp = await readTmpJson<Script[]>(TMP_SCRIPTS_PATH);
  if (Array.isArray(fromTmp) && fromTmp.length > 0) {
    return fromTmp;
  }

  const seed = await readSeedScripts();
  if (seed.length > 0) {
    await writeTmpJson(TMP_SCRIPTS_PATH, seed).catch(() => {});
  }
  return seed;
}

/**
 * Persistently save scripts to private Vercel Blob.
 * Throws if the write fails so caller does not report false success.
 */
export async function saveStoredScripts(scripts: Script[]): Promise<void> {
  await writeTmpJson(TMP_SCRIPTS_PATH, scripts);

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_SCRIPTS_PATHNAME, scripts);
    console.info(`[Storage] Confirmed write of ${scripts.length} scripts to private Vercel Blob.`);
  }
}
