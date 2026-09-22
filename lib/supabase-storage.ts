import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ensureLocalStorageServer } from './supabase-emulator';

// Server-only guard: prevent any client component from bundling this module
if (typeof window !== 'undefined') {
  throw new Error('[Supabase Storage] This module can only be executed in a server environment.');
}

interface StorageEnvConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
  isEmulator?: boolean;
}

let validationPerformed = false;
let validatedConfig: StorageEnvConfig | null = null;
let validationErrorMessage: string | null = null;
let cachedClient: SupabaseClient | null = null;

function isRemoteSupabaseUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  if (
    trimmed.includes('11111111') ||
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1')
  ) {
    return false;
  }
  return true;
}

/**
 * Validates SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_BUCKET once in the server-only storage client.
 * Caches the result so validation is executed exactly once per runtime instance.
 * Automatically provisions the local persistent emulator in development when no remote Supabase is configured.
 */
function validateStorageEnvironmentOnce(): StorageEnvConfig {
  if (validationPerformed) {
    if (validationErrorMessage || !validatedConfig) {
      throw new Error(validationErrorMessage || '[Supabase Storage] Storage environment is not valid.');
    }
    return validatedConfig;
  }

  const rawUrl = process.env.SUPABASE_URL?.trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const rawBucket = process.env.SUPABASE_BUCKET?.trim() || 'nova-hub';

  const isRemote = isRemoteSupabaseUrl(rawUrl);

  // In production (e.g. Vercel), require valid remote Supabase credentials
  if (process.env.VERCEL === '1' && !isRemote) {
    validationPerformed = true;
    validationErrorMessage =
      '[Supabase Storage] Missing or invalid SUPABASE_URL in production environment. A valid Supabase project URL is required.';
    throw new Error(validationErrorMessage);
  }

  if (isRemote) {
    if (!rawKey || rawKey.includes('11111111')) {
      validationPerformed = true;
      validationErrorMessage =
        '[Supabase Storage] SUPABASE_SERVICE_ROLE_KEY is required when using a remote Supabase URL.';
      throw new Error(validationErrorMessage);
    }

    validatedConfig = {
      url: rawUrl!,
      serviceRoleKey: rawKey,
      bucket: rawBucket,
      isEmulator: false,
    };
  } else {
    // Local / development / container fallback: start persistent emulator on 127.0.0.1:54321
    try {
      validatedConfig = {
        url: 'http://127.0.0.1:54321',
        serviceRoleKey: rawKey || 'emulator-service-role-key',
        bucket: rawBucket,
        isEmulator: true,
      };
    } catch (err: any) {
      validationPerformed = true;
      validationErrorMessage = `[Supabase Storage] Failed to initialize persistent storage: ${err?.message || err}`;
      throw new Error(validationErrorMessage);
    }
  }

  validationPerformed = true;
  return validatedConfig;
}

export async function ensureStorageReady(): Promise<void> {
  const config = validateStorageEnvironmentOnce();
  if (config.isEmulator) {
    await ensureLocalStorageServer();
  }
}

/**
 * Check whether Supabase Storage variables are present and valid.
 * Performs validation once without throwing or leaking secrets.
 */
export function isSupabaseStorageConfigured(): boolean {
  try {
    validateStorageEnvironmentOnce();
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and retrieves the target Supabase Storage bucket name.
 */
export function getSupabaseBucket(): string {
  const config = validateStorageEnvironmentOnce();
  return config.bucket;
}

/**
 * Returns a configured server-side Supabase client with the service role key.
 * Throws a clear error when storage environment cannot be initialized.
 */
export function getSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('[Supabase Storage] Supabase client cannot be initialized in the browser.');
  }

  const config = validateStorageEnvironmentOnce();

  if (!cachedClient) {
    cachedClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

/**
 * Sanitize and validate object paths to prevent path traversal or malformed keys.
 */
export function validateStoragePath(path: string): string {
  if (!path || typeof path !== 'string') {
    throw new Error('[Supabase Storage] Path must be a non-empty string.');
  }

  const normalized = path.trim().replace(/\\/g, '/').replace(/^\/+/, '');

  if (!normalized) {
    throw new Error('[Supabase Storage] Path cannot be empty or root.');
  }

  // Prevent directory traversal attacks
  if (normalized.includes('..')) {
    throw new Error(`[Supabase Storage] Directory traversal detected in path: "${path}"`);
  }

  // Verify safe segment characters (alphanumeric, hyphens, underscores, dots)
  const segments = normalized.split('/');
  for (const seg of segments) {
    if (!seg || !/^[a-zA-Z0-9_\-\.]+$/.test(seg)) {
      throw new Error(`[Supabase Storage] Invalid path segment "${seg}" in path: "${path}"`);
    }
  }

  return normalized;
}

/**
 * Sanitizes errors so secrets like SUPABASE_SERVICE_ROLE_KEY are never leaked in logs or responses.
 */
function sanitizeError(err: unknown): Error {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  let message = err instanceof Error ? err.message : String(err || 'Unknown error');
  if (serviceKey && serviceKey.length > 5) {
    message = message.replaceAll(serviceKey, '[REDACTED_KEY]');
  }
  message = message.replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, 'Bearer [REDACTED_TOKEN]');
  message = message.replace(/apikey=([^&\s]+)/gi, 'apikey=[REDACTED_KEY]');
  const cleanError = new Error(message);
  cleanError.name = err instanceof Error ? err.name : 'SupabaseStorageError';
  return cleanError;
}

/**
 * Download a raw object from the private Supabase Storage bucket.
 * Returns null if the object does not exist (404).
 * Throws a clean error if Supabase Storage fails or cannot be reached.
 */
export async function downloadObject(path: string): Promise<Blob | null> {
  await ensureStorageReady();
  const cleanPath = validateStoragePath(path);
  const client = getSupabaseClient();
  const bucket = getSupabaseBucket();

  try {
    const { data, error } = await client.storage.from(bucket).download(cleanPath);

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      const status = (error as any)?.status || (error as any)?.statusCode;
      if (
        msg.includes('not found') ||
        msg.includes('does not exist') ||
        msg.includes('404') ||
        status === 404 ||
        status === '404'
      ) {
        return null;
      }
      throw sanitizeError(error);
    }

    return data;
  } catch (err) {
    const sanitized = sanitizeError(err);
    if (
      sanitized.message.toLowerCase().includes('not found') ||
      sanitized.message.includes('404')
    ) {
      return null;
    }
    throw sanitized;
  }
}

/**
 * Read an object as UTF-8 text from the private Supabase bucket.
 * Returns null if not found. Throws on storage error.
 */
export async function readText(path: string): Promise<string | null> {
  const blob = await downloadObject(path);
  if (!blob) return null;
  const text = await blob.text();
  return text;
}

/**
 * Read and parse JSON from the private Supabase bucket.
 * Returns null if the file does not exist. Throws on network/storage/parse error.
 */
export async function readJson<T>(path: string): Promise<T | null> {
  const text = await readText(path);
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as T;
  } catch (parseErr) {
    console.error(`[Supabase Storage] Failed parsing JSON at ${path}:`, parseErr);
    throw new Error(`[Supabase Storage] Corrupted JSON at ${path}`);
  }
}

/**
 * Upload or overwrite an object in the private Supabase Storage bucket.
 * Throws an error if upload fails.
 */
export async function uploadObject(
  path: string,
  body: string | ArrayBuffer | Blob | Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<void> {
  await ensureStorageReady();
  const cleanPath = validateStoragePath(path);
  const client = getSupabaseClient();
  const bucket = getSupabaseBucket();

  try {
    const { error } = await client.storage.from(bucket).upload(cleanPath, body, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert !== undefined ? options.upsert : true,
    });

    if (error) {
      throw sanitizeError(error);
    }
  } catch (err) {
    throw sanitizeError(err);
  }
}

/**
 * Write a JSON payload to the private Supabase Storage bucket with upsert enabled.
 * Throws a clear error if upload fails.
 */
export async function writeJson<T>(path: string, data: T): Promise<void> {
  const cleanPath = validateStoragePath(path);
  const payload = JSON.stringify(data, null, 2);
  await uploadObject(cleanPath, payload, {
    contentType: 'application/json; charset=utf-8',
    upsert: true,
  });
}

/**
 * Write text or Lua script source to the private Supabase Storage bucket with upsert enabled.
 * Throws a clear error if upload fails.
 */
export async function writeText(
  path: string,
  content: string,
  contentType: string = 'text/plain; charset=utf-8'
): Promise<void> {
  const cleanPath = validateStoragePath(path);
  await uploadObject(cleanPath, content, {
    contentType,
    upsert: true,
  });
}

/**
 * Delete a single object from the private Supabase Storage bucket.
 * Throws a clear error if delete fails.
 */
export async function deleteObject(path: string): Promise<void> {
  await ensureStorageReady();
  const cleanPath = validateStoragePath(path);
  const client = getSupabaseClient();
  const bucket = getSupabaseBucket();

  try {
    const { error } = await client.storage.from(bucket).remove([cleanPath]);
    if (error) {
      throw sanitizeError(error);
    }
  } catch (err) {
    throw sanitizeError(err);
  }
}

/**
 * Delete multiple objects from the private Supabase Storage bucket.
 * Throws a clear error if delete fails.
 */
export async function deleteObjects(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return;
  await ensureStorageReady();
  const cleanPaths = paths.map(validateStoragePath);
  const client = getSupabaseClient();
  const bucket = getSupabaseBucket();

  try {
    const { error } = await client.storage.from(bucket).remove(cleanPaths);
    if (error) {
      throw sanitizeError(error);
    }
  } catch (err) {
    throw sanitizeError(err);
  }
}

/**
 * List objects within a folder prefix in the private Supabase Storage bucket.
 */
export async function listObjects(prefix: string = ''): Promise<string[]> {
  await ensureStorageReady();
  const client = getSupabaseClient();
  const bucket = getSupabaseBucket();
  const cleanPrefix = prefix ? validateStoragePath(prefix) : '';

  try {
    const { data, error } = await client.storage.from(bucket).list(cleanPrefix, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw sanitizeError(error);
    }

    return (data || []).map((item) => (cleanPrefix ? `${cleanPrefix}/${item.name}` : item.name));
  } catch (err) {
    throw sanitizeError(err);
  }
}

/**
 * Check whether an object exists in the private Supabase Storage bucket.
 */
export async function objectExists(path: string): Promise<boolean> {
  await ensureStorageReady();
  const cleanPath = validateStoragePath(path);
  const client = getSupabaseClient();
  const bucket = getSupabaseBucket();

  try {
    const { data, error } = await client.storage.from(bucket).exists(cleanPath);
    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('not found') || msg.includes('404')) {
        return false;
      }
      throw sanitizeError(error);
    }
    return Boolean(data);
  } catch (err) {
    const sanitized = sanitizeError(err);
    if (
      sanitized.message.toLowerCase().includes('not found') ||
      sanitized.message.includes('404')
    ) {
      return false;
    }
    throw sanitized;
  }
}
