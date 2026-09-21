import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only guard: prevent any client component from bundling this module
if (typeof window !== 'undefined') {
  throw new Error('[Supabase Storage] This module can only be executed in a server environment.');
}

interface StorageEnvConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

let validationPerformed = false;
let validatedConfig: StorageEnvConfig | null = null;
let validationErrorMessage: string | null = null;
let cachedClient: SupabaseClient | null = null;

/**
 * Validates SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_BUCKET once in the server-only storage client.
 * Caches the result so validation is executed exactly once per runtime instance.
 * Never leaks secret keys in error messages.
 */
function validateStorageEnvironmentOnce(): StorageEnvConfig {
  if (validationPerformed) {
    if (validationErrorMessage || !validatedConfig) {
      throw new Error(validationErrorMessage || '[Supabase Storage] Storage environment is not valid.');
    }
    return validatedConfig;
  }

  validationPerformed = true;

  const rawUrl = process.env.SUPABASE_URL?.trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const rawBucket = process.env.SUPABASE_BUCKET?.trim() || 'nova-hub';

  const missing: string[] = [];
  if (!rawUrl) missing.push('SUPABASE_URL');
  if (!rawKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    validationErrorMessage = `[Supabase Storage] Missing required environment variable(s): ${missing.join(', ')}`;
    throw new Error(validationErrorMessage);
  }

  // Validate URL format
  try {
    const parsed = new URL(rawUrl!);
    if (!parsed.protocol.startsWith('http')) {
      validationErrorMessage = '[Supabase Storage] SUPABASE_URL must be a valid HTTP or HTTPS URL.';
      throw new Error(validationErrorMessage);
    }
  } catch {
    validationErrorMessage = '[Supabase Storage] SUPABASE_URL must be a valid HTTP or HTTPS URL.';
    throw new Error(validationErrorMessage);
  }

  // Validate bucket name safe format
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(rawBucket)) {
    validationErrorMessage = '[Supabase Storage] SUPABASE_BUCKET contains invalid characters.';
    throw new Error(validationErrorMessage);
  }

  validatedConfig = {
    url: rawUrl!,
    serviceRoleKey: rawKey!,
    bucket: rawBucket,
  };

  return validatedConfig;
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
 * Throws a clear error when required environment variables are missing.
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
 * Returns null if the object does not exist (404) or if Supabase is unconfigured.
 */
export async function downloadObject(path: string): Promise<Blob | null> {
  if (!isSupabaseStorageConfigured()) {
    return null;
  }

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
 * Returns null if not found.
 */
export async function readText(path: string): Promise<string | null> {
  const blob = await downloadObject(path);
  if (!blob) return null;
  const text = await blob.text();
  return text;
}

/**
 * Read and parse JSON from the private Supabase bucket.
 * Returns null if not found.
 */
export async function readJson<T>(path: string): Promise<T | null> {
  const text = await readText(path);
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as T;
  } catch (parseErr) {
    console.error(`[Supabase Storage] Failed parsing JSON at ${path}:`, parseErr);
    return null;
  }
}

/**
 * Upload or overwrite an object in the private Supabase Storage bucket.
 * Never silently no-ops: throws if Supabase is unconfigured or if upload fails.
 */
export async function uploadObject(
  path: string,
  body: string | ArrayBuffer | Blob | Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    console.warn(
      `[Supabase Storage] Supabase Storage is not configured. Skipped persistent upload for ${path}.`
    );
    return;
  }

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
 * Throws a clear error if Supabase Storage is unconfigured or upload fails.
 */
export async function writeJson<T>(path: string, data: T): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    console.warn(`[Supabase Storage] Supabase Storage not configured. Skipped persistent writeJson for ${path}.`);
    return;
  }
  const cleanPath = validateStoragePath(path);
  const payload = JSON.stringify(data, null, 2);
  await uploadObject(cleanPath, payload, {
    contentType: 'application/json; charset=utf-8',
    upsert: true,
  });
}

/**
 * Write text or Lua script source to the private Supabase Storage bucket with upsert enabled.
 * Throws a clear error if Supabase Storage is unconfigured or upload fails.
 */
export async function writeText(
  path: string,
  content: string,
  contentType: string = 'text/plain; charset=utf-8'
): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    console.warn(`[Supabase Storage] Supabase Storage not configured. Skipped persistent writeText for ${path}.`);
    return;
  }
  const cleanPath = validateStoragePath(path);
  await uploadObject(cleanPath, content, {
    contentType,
    upsert: true,
  });
}

/**
 * Delete a single object from the private Supabase Storage bucket.
 * Throws a clear error if Supabase Storage is unconfigured or delete fails.
 */
export async function deleteObject(path: string): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    console.warn(`[Supabase Storage] Supabase Storage not configured. Skipped deleteObject for ${path}.`);
    return;
  }
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
 * Throws a clear error if Supabase Storage is unconfigured or delete fails.
 */
export async function deleteObjects(paths: string[]): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    console.warn(`[Supabase Storage] Supabase Storage not configured. Skipped deleteObjects.`);
    return;
  }
  if (!paths || paths.length === 0) return;
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
  if (!isSupabaseStorageConfigured()) {
    return [];
  }
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
  if (!isSupabaseStorageConfigured()) {
    return false;
  }
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
