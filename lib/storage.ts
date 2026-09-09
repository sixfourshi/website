import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { get, put, list } from '@vercel/blob';
import type { RobloxGame } from './games';
import type { Script } from './scripts';

const BLOB_GAMES_PATHNAME = 'sourhub/games.json';
const BLOB_SCRIPTS_PATHNAME = 'sourhub/scripts.json';

// Local temporary writable path (guaranteed writable on Vercel Serverless, Linux, Windows, macOS)
const TMP_DIR = os.tmpdir();
const TMP_GAMES_PATH = path.join(TMP_DIR, 'sourhub_games.json');
const TMP_SCRIPTS_PATH = path.join(TMP_DIR, 'sourhub_scripts.json');

// Read-only project seed files (NEVER written to)
const SEED_GAMES_PATH = path.join(process.cwd(), 'data', 'games.json');
const SEED_SCRIPTS_PATH = path.join(process.cwd(), 'data', 'scripts.json');

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.trim().length > 0);
}

// Read JSON from Vercel Blob using process.env.BLOB_READ_WRITE_TOKEN
async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  try {
    const result = await get(pathname, { access: 'public', token });
    if (result && result.statusCode === 200 && result.stream) {
      const text = await new Response(result.stream).text();
      if (text && text.trim().length > 0) {
        return JSON.parse(text) as T;
      }
    }
  } catch (err: any) {
    // If get throws BlobNotFoundError or isn't supported for that path yet, fallback to list lookup
    try {
      const { blobs } = await list({ prefix: pathname, token });
      const match = blobs.find((b) => b.pathname === pathname);
      if (match?.downloadUrl) {
        const res = await fetch(`${match.downloadUrl}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          return (await res.json()) as T;
        }
      }
    } catch (listErr) {
      console.warn(`[Storage] Blob read failed for ${pathname}:`, listErr);
    }
  }
  return null;
}

// Write JSON to Vercel Blob using process.env.BLOB_READ_WRITE_TOKEN
async function writeBlobJson<T>(pathname: string, data: T): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;

  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'public',
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
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

// Write to /tmp fallback
async function writeTmpJson<T>(tmpPath: string, data: T): Promise<void> {
  try {
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Storage] Failed writing to temporary file ${tmpPath}:`, err);
  }
}

// Read seed data from project filesystem (Read-only)
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
 * Reads from Vercel Blob (if configured), falling back to /tmp.
 * If storage is empty, imports from seed games.json once.
 */
export async function getStoredGames(): Promise<RobloxGame[]> {
  if (isBlobStorageConfigured()) {
    const fromBlob = await readBlobJson<RobloxGame[]>(BLOB_GAMES_PATHNAME);
    if (Array.isArray(fromBlob) && fromBlob.length > 0) {
      // Sync local /tmp cache
      writeTmpJson(TMP_GAMES_PATH, fromBlob).catch(() => {});
      return fromBlob;
    }

    // Storage is empty in Blob, seed it once from seed file
    const seed = await readSeedGames();
    if (seed.length > 0) {
      try {
        await writeBlobJson(BLOB_GAMES_PATHNAME, seed);
      } catch (err) {
        console.warn('[Storage] Failed initial seed write to Vercel Blob:', err);
      }
      writeTmpJson(TMP_GAMES_PATH, seed).catch(() => {});
      return seed;
    }
  }

  // Fallback: Read from local /tmp
  const fromTmp = await readTmpJson<RobloxGame[]>(TMP_GAMES_PATH);
  if (Array.isArray(fromTmp) && fromTmp.length > 0) {
    return fromTmp;
  }

  // Seed /tmp from read-only data/games.json
  const seed = await readSeedGames();
  if (seed.length > 0) {
    await writeTmpJson(TMP_GAMES_PATH, seed);
  }
  return seed;
}

/**
 * Persistently save games without writing to the deployed read-only filesystem.
 */
export async function saveStoredGames(games: RobloxGame[]): Promise<void> {
  // Always update /tmp cache
  await writeTmpJson(TMP_GAMES_PATH, games);

  // If Vercel Blob is configured, save persistently
  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_GAMES_PATHNAME, games);
  } else {
    console.info(
      '[Storage] Saved games to /tmp. To persist changes permanently across Vercel deployments, connect Vercel Blob storage (BLOB_READ_WRITE_TOKEN).'
    );
  }
}

/**
 * Get all stored scripts.
 * Reads from Vercel Blob (if configured), falling back to /tmp.
 * If storage is empty, imports from seed scripts.json once.
 */
export async function getStoredScripts(): Promise<Script[]> {
  if (isBlobStorageConfigured()) {
    const fromBlob = await readBlobJson<Script[]>(BLOB_SCRIPTS_PATHNAME);
    if (Array.isArray(fromBlob) && fromBlob.length > 0) {
      writeTmpJson(TMP_SCRIPTS_PATH, fromBlob).catch(() => {});
      return fromBlob;
    }

    // Seed Vercel Blob once from seed file
    const seed = await readSeedScripts();
    if (seed.length > 0) {
      try {
        await writeBlobJson(BLOB_SCRIPTS_PATHNAME, seed);
      } catch (err) {
        console.warn('[Storage] Failed initial seed write to Vercel Blob:', err);
      }
      writeTmpJson(TMP_SCRIPTS_PATH, seed).catch(() => {});
      return seed;
    }
  }

  // Fallback: Read from local /tmp
  const fromTmp = await readTmpJson<Script[]>(TMP_SCRIPTS_PATH);
  if (Array.isArray(fromTmp) && fromTmp.length > 0) {
    return fromTmp;
  }

  // Seed /tmp from read-only data/scripts.json
  const seed = await readSeedScripts();
  if (seed.length > 0) {
    await writeTmpJson(TMP_SCRIPTS_PATH, seed);
  }
  return seed;
}

/**
 * Persistently save scripts without writing to the deployed read-only filesystem.
 */
export async function saveStoredScripts(scripts: Script[]): Promise<void> {
  await writeTmpJson(TMP_SCRIPTS_PATH, scripts);

  if (isBlobStorageConfigured()) {
    await writeBlobJson(BLOB_SCRIPTS_PATHNAME, scripts);
  } else {
    console.info(
      '[Storage] Saved scripts to /tmp. To persist changes permanently across Vercel deployments, connect Vercel Blob storage (BLOB_READ_WRITE_TOKEN).'
    );
  }
}
