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
  const rawBucket = process.env.SUPABASE_BUCKET?.trim().replace(/^["']|["']$/g, '') || 'nova-hub';
  const cleanBucket = rawBucket.replace(/^\/+|\/+$/g, '').split('/')[0] || 'nova-hub';

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
      bucket: cleanBucket,
      isEmulator: false,
    };
  } else {
    // Local / development / container fallback: start persistent emulator on 127.0.0.1:54321
    try {
      validatedConfig = {
        url: 'http://127.0.0.1:54321',
        serviceRoleKey: rawKey || 'emulator-service-role-key',
        bucket: cleanBucket,
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
/**
 * Sanitize and validate object paths to prevent path traversal or malformed keys.
 * Ensures path is relative to the selected bucket and eliminates redundant bucket prefixes.
 */
export function validateStoragePath(path: string, bucketName?: string): string {
  if (!path || typeof path !== 'string') {
    throw new Error('[Supabase Storage] Path must be a non-empty string.');
  }

  // Strip leading and trailing slashes, replace backslashes, eliminate consecutive slashes
  let normalized = path.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  normalized = normalized.replace(/\/{2,}/g, '/');

  if (!normalized) {
    throw new Error('[Supabase Storage] Path cannot be empty or root.');
  }

  // Prevent directory traversal attacks
  if (normalized.includes('..')) {
    throw new Error(`[Supabase Storage] Directory traversal detected in path: "${path}"`);
  }

  // Strip redundant duplicate bucket prefix if path starts with "${bucket}/${bucket}/"
  if (bucketName) {
    const cleanBucket = bucketName.trim().replace(/^["']|["']$/g, '').replace(/^\/+|\/+$/g, '');
    if (cleanBucket && normalized.startsWith(`${cleanBucket}/${cleanBucket}/`)) {
      normalized = normalized.slice(cleanBucket.length + 1);
    }
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
 * Determines whether a Supabase Storage error indicates a missing object/resource
 * (404, NoSuchKey, or 400 with "Invalid path specified in request URL" from storage-api).
 */
export function isNotFoundError(err: any): boolean {
  if (!err) return false;
  const status = err.status ?? err.statusCode;
  const statusNum = typeof status === 'number' ? status : parseInt(status, 10);
  const msg = (err.message || '').toLowerCase();
  const errorProp = (err.error || '').toLowerCase();

  // Status code 404
  if (statusNum === 404 || status === '404') return true;

  // Supabase Storage API returns 400 Bad Request with "Invalid path specified in request URL"
  // or "Invalid path" / "Invalid key" / "NoSuchKey" when an object does not exist
  if (
    msg.includes('not found') ||
    msg.includes('does not exist') ||
    msg.includes('404') ||
    msg.includes('nosuchkey') ||
    msg.includes('invalid path specified in request url') ||
    msg.includes('invalid path') ||
    msg.includes('invalid key') ||
    errorProp.includes('not_found') ||
    errorProp.includes('nosuchkey')
  ) {
    return true;
  }

  return false;
}

/**
 * Sanitizes errors so secrets like SUPABASE_SERVICE_ROLE_KEY are never leaked in logs or responses.
 */
export function sanitizeError(err: unknown): Error {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  let message = err instanceof Error ? err.message : String(err || 'Unknown error');
  if (serviceKey && serviceKey.length > 5) {
    message = message.replaceAll(serviceKey, '[REDACTED_KEY]');
  }
  message = message.replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, 'Bearer [REDACTED_TOKEN]');
  message = message.replace(/apikey=([^&\s]+)/gi, 'apikey=[REDACTED_KEY]');
  message = message.replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
  const cleanError = new Error(message);
  cleanError.name = err instanceof Error ? err.name : 'SupabaseStorageError';
  return cleanError;
}

/**
 * Download a raw object from the private Supabase Storage bucket.
 * Returns null if the object does not exist (404 or missing object path).
 * Throws a clean error if Supabase Storage encounters real auth/bucket/network issues.
 */
export async function downloadObject(path: string): Promise<Blob | null> {
  await ensureStorageReady();
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
  const client = getSupabaseClient();

  try {
    const { data, error } = await client.storage.from(bucket).download(cleanPath);

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      const sanitized = sanitizeError(error);
      console.error(
        `[Supabase Storage:downloadObject] Download error for path "${cleanPath}" in bucket "${bucket}":`,
        sanitized.message
      );
      throw sanitized;
    }

    return data;
  } catch (err: any) {
    if (isNotFoundError(err)) {
      return null;
    }
    const sanitized = sanitizeError(err);
    console.error(
      `[Supabase Storage:downloadObject] Unexpected error for path "${cleanPath}" in bucket "${bucket}":`,
      sanitized.message
    );
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
 * Returns null if the file does not exist or has invalid/uninitialized content.
 * Throws on real storage/network errors.
 */
export async function readJson<T>(path: string): Promise<T | null> {
  const text = await readText(path);
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as T;
  } catch (parseErr: any) {
    console.warn(
      `[Supabase Storage:readJson] Invalid or corrupted JSON at "${path}", treating as missing/uninitialized:`,
      parseErr?.message || parseErr
    );
    return null;
  }
}

/**
 * Upload or overwrite an object in the private Supabase Storage bucket.
 * Throws an error if upload fails, with clear logging identifying the path and bucket.
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
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
  const client = getSupabaseClient();

  try {
    const { error } = await client.storage.from(bucket).upload(cleanPath, body, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert !== undefined ? options.upsert : true,
    });

    if (error) {
      const sanitized = sanitizeError(error);
      console.error(
        `[Supabase Storage:uploadObject] Upload failed for path "${cleanPath}" in bucket "${bucket}":`,
        sanitized.message
      );
      throw sanitized;
    }
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    console.error(
      `[Supabase Storage:uploadObject] Upload exception for path "${cleanPath}" in bucket "${bucket}":`,
      sanitized.message
    );
    throw sanitized;
  }
}

/**
 * Write a JSON payload to the private Supabase Storage bucket with upsert enabled.
 * Throws a clear error if upload fails.
 */
export async function writeJson<T>(path: string, data: T): Promise<void> {
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
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
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
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
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
  const client = getSupabaseClient();

  try {
    const { error } = await client.storage.from(bucket).remove([cleanPath]);
    if (error) {
      const sanitized = sanitizeError(error);
      console.error(
        `[Supabase Storage:deleteObject] Delete failed for path "${cleanPath}" in bucket "${bucket}":`,
        sanitized.message
      );
      throw sanitized;
    }
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    console.error(
      `[Supabase Storage:deleteObject] Delete exception for path "${cleanPath}" in bucket "${bucket}":`,
      sanitized.message
    );
    throw sanitized;
  }
}

/**
 * Delete multiple objects from the private Supabase Storage bucket.
 * Throws a clear error if delete fails.
 */
export async function deleteObjects(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return;
  await ensureStorageReady();
  const bucket = getSupabaseBucket();
  const cleanPaths = paths.map((p) => validateStoragePath(p, bucket));
  const client = getSupabaseClient();

  try {
    const { error } = await client.storage.from(bucket).remove(cleanPaths);
    if (error) {
      const sanitized = sanitizeError(error);
      console.error(
        `[Supabase Storage:deleteObjects] Delete failed in bucket "${bucket}":`,
        sanitized.message
      );
      throw sanitized;
    }
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    console.error(
      `[Supabase Storage:deleteObjects] Delete exception in bucket "${bucket}":`,
      sanitized.message
    );
    throw sanitized;
  }
}

/**
 * List objects within a folder prefix in the private Supabase Storage bucket.
 */
export async function listObjects(prefix: string = ''): Promise<string[]> {
  await ensureStorageReady();
  const bucket = getSupabaseBucket();
  const client = getSupabaseClient();
  const cleanPrefix = prefix ? validateStoragePath(prefix, bucket) : '';

  try {
    const { data, error } = await client.storage.from(bucket).list(cleanPrefix, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      const sanitized = sanitizeError(error);
      console.error(
        `[Supabase Storage:listObjects] List failed for prefix "${cleanPrefix}" in bucket "${bucket}":`,
        sanitized.message
      );
      throw sanitized;
    }

    return (data || []).map((item) => (cleanPrefix ? `${cleanPrefix}/${item.name}` : item.name));
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    console.error(
      `[Supabase Storage:listObjects] List exception for prefix "${cleanPrefix}" in bucket "${bucket}":`,
      sanitized.message
    );
    throw sanitized;
  }
}

/**
 * Check whether an object exists in the private Supabase Storage bucket.
 */
export async function objectExists(path: string): Promise<boolean> {
  await ensureStorageReady();
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
  const client = getSupabaseClient();

  try {
    const { data, error } = await client.storage.from(bucket).exists(cleanPath);
    if (error) {
      if (isNotFoundError(error)) {
        return false;
      }
      const sanitized = sanitizeError(error);
      console.warn(
        `[Supabase Storage:objectExists] Check failed for path "${cleanPath}" in bucket "${bucket}":`,
        sanitized.message
      );
      return false;
    }
    return Boolean(data);
  } catch (err: any) {
    if (isNotFoundError(err)) {
      return false;
    }
    const sanitized = sanitizeError(err);
    console.warn(
      `[Supabase Storage:objectExists] Check exception for path "${cleanPath}" in bucket "${bucket}":`,
      sanitized.message
    );
    return false;
  }
}
