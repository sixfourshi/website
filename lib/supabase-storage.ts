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
/**
 * Strips all invalid characters, hidden whitespace, newlines, tabs, quotes,
 * full URLs, and path segments to ensure an exact bucket name (defaulting to 'nova-hub').
 */
export function sanitizeBucketName(raw?: string): string {
  if (!raw || typeof raw !== 'string') return 'nova-hub';
  // Strip all CR, LF, tabs, null bytes, and surrounding whitespace
  let clean = raw.replace(/[\r\n\t\0]/g, '').trim();
  // Strip surrounding quotes (double, single, backticks)
  clean = clean.replace(/^["'`]+|["'`]+$/g, '').trim();

  // If a full URL was accidentally passed in SUPABASE_BUCKET
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const url = new URL(clean);
      const segments = url.pathname.split('/').filter(Boolean);
      clean = segments[segments.length - 1] || 'nova-hub';
    } catch {
      clean = clean.split('/').pop() || 'nova-hub';
    }
  }

  // Strip leading and trailing slashes (forward and backslashes)
  clean = clean.replace(/^[\/\\]+|[\/\\]+$/g, '');

  // Extract bucket name only, never subpaths (e.g. "nova-hub/games.json" -> "nova-hub")
  if (clean.includes('/')) {
    clean = clean.split('/')[0].trim();
  }
  if (clean.includes('\\')) {
    clean = clean.split('\\')[0].trim();
  }

  // Final trim and unquote
  clean = clean.replace(/^["'`]+|["'`]+$/g, '').trim();

  return clean || 'nova-hub';
}

/**
 * Sanitizes SUPABASE_URL to guarantee a clean origin (e.g. https://<project>.supabase.co)
 * without trailing slashes, whitespace, quotes, or accidental API paths like /rest/v1 or /storage/v1.
 */
export function sanitizeSupabaseUrl(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.replace(/[\r\n\t\0]/g, '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
  try {
    const parsed = new URL(clean);
    // Origin strips subpaths, trailing slashes, and query params (prevents accidental PostgREST /rest/v1 routing)
    clean = parsed.origin;
  } catch {
    clean = clean.replace(/\/+$/, '');
  }
  return clean;
}

function validateStorageEnvironmentOnce(): StorageEnvConfig {
  if (validationPerformed) {
    if (validationErrorMessage || !validatedConfig) {
      throw new Error(validationErrorMessage || '[Supabase Storage] Storage environment is not valid.');
    }
    return validatedConfig;
  }

  const rawUrl = sanitizeSupabaseUrl(process.env.SUPABASE_URL);
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/[\r\n\t\0]/g, '').trim().replace(/^["'`]+|["'`]+$/g, '').trim()
    : '';
  const cleanBucket = sanitizeBucketName(process.env.SUPABASE_BUCKET);

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
      url: rawUrl,
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

  // Strip invisible characters, carriage returns, newlines, tabs, and outer quotes
  let normalized = path.replace(/[\r\n\t\0]/g, '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();

  // If a full URL was provided, extract the pathname
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const url = new URL(normalized);
      normalized = url.pathname;
    } catch {}
  }

  // Strip leading storage API prefixes if accidentally present in path
  normalized = normalized.replace(/^\/?storage\/v1\/object\/(public\/|authenticated\/)?/, '');

  // Normalize slashes: replace backslashes with forward slashes
  normalized = normalized.replace(/\\/g, '/');

  // Eliminate consecutive slashes and strip leading/trailing slashes
  normalized = normalized.replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '');

  if (!normalized) {
    throw new Error('[Supabase Storage] Path cannot be empty or root.');
  }

  // Prevent directory traversal attacks
  if (normalized.split('/').includes('..') || normalized.includes('../') || normalized.includes('/..')) {
    throw new Error(`[Supabase Storage] Directory traversal detected in path: "${path}"`);
  }

  // Only remove genuinely malformed DUPLICATED paths:
  // e.g., "${cleanBucket}/${cleanBucket}/" -> "${cleanBucket}/"
  const cleanBucket = bucketName ? sanitizeBucketName(bucketName) : '';
  if (cleanBucket) {
    while (normalized.startsWith(`${cleanBucket}/${cleanBucket}/`)) {
      normalized = normalized.slice(cleanBucket.length + 1);
    }
  }

  // Strip redundant duplicate namespace prefixes like nova-hub/nova-hub/ or sourhub/sourhub/
  while (normalized.startsWith('nova-hub/nova-hub/')) {
    normalized = normalized.slice('nova-hub/'.length);
  }
  while (normalized.startsWith('sourhub/sourhub/')) {
    normalized = normalized.slice('sourhub/'.length);
  }

  // Strictly relative object path without leading slash
  normalized = normalized.replace(/^\/+/, '');

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
 * Determines whether a Supabase Storage error indicates a missing object/resource (strictly 404).
 * Does NOT classify 400 Bad Request or "Invalid path specified in request URL" as not found.
 */
export function isNotFoundError(err: any): boolean {
  if (!err) return false;
  const status = err.status ?? err.statusCode;
  const statusNum = typeof status === 'number' ? status : parseInt(status, 10);
  const msg = (err.message || '').toLowerCase();
  const errorProp = (err.error || '').toLowerCase();

  // Status code 404 is strictly Not Found
  if (statusNum === 404 || status === '404') return true;

  // Standard object not found messages
  if (
    msg.includes('not found') ||
    msg.includes('does not exist') ||
    msg.includes('nosuchkey') ||
    errorProp.includes('not_found') ||
    errorProp.includes('nosuchkey')
  ) {
    // Explicitly exclude malformed path / bad request messages
    if (!msg.includes('invalid path') && !msg.includes('invalid key')) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes errors so secrets like SUPABASE_SERVICE_ROLE_KEY are never leaked in logs or responses.
 * Retains statusCode and error properties on the returned Error instance.
 */
export function sanitizeError(err: unknown): Error & { statusCode?: number | string; error?: string } {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  let message = err instanceof Error ? err.message : String(err || 'Unknown error');
  if (serviceKey && serviceKey.length > 5) {
    message = message.replaceAll(serviceKey, '[REDACTED_KEY]');
  }
  message = message.replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, 'Bearer [REDACTED_TOKEN]');
  message = message.replace(/apikey=([^&\s]+)/gi, 'apikey=[REDACTED_KEY]');
  message = message.replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
  const cleanError = new Error(message) as Error & { statusCode?: number | string; error?: string };
  cleanError.name = (err as any)?.name || (err as any)?.error || 'SupabaseStorageError';
  cleanError.statusCode = (err as any)?.statusCode || (err as any)?.status;
  cleanError.error = (err as any)?.error || (err as any)?.name;
  return cleanError;
}

/**
 * Download a raw object from the private Supabase Storage bucket.
 * Returns null if the object does not exist (404).
 * Throws a clean error if Supabase Storage encounters real auth/bucket/network/path issues.
 */
export async function downloadObject(path: string): Promise<Blob | null> {
  await ensureStorageReady();
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
  const client = getSupabaseClient();

  // Production-safe diagnostics immediately before .download()
  console.info('[Supabase download target]', {
    bucket,
    path: cleanPath,
    pathLength: cleanPath.length,
    bucketLength: bucket.length,
    bucketJson: JSON.stringify(bucket),
    pathJson: JSON.stringify(cleanPath),
  });

  try {
    const { data, error } = await client.storage.from(bucket).download(cleanPath);

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      const sanitized = sanitizeError(error);
      const status = (error as any).statusCode || (error as any).status;
      const errorName = (error as any).error || (error as any).name;
      console.error('[Supabase download failure]', {
        statusCode: status,
        error: errorName,
        message: sanitized.message,
        bucket,
        path: cleanPath,
      });
      throw sanitized;
    }

    return data;
  } catch (err: any) {
    if (isNotFoundError(err)) {
      return null;
    }
    const sanitized = sanitizeError(err);
    const status = err?.statusCode || err?.status;
    const errorName = err?.error || err?.name;
    console.error('[Supabase download failure]', {
      statusCode: status,
      error: errorName,
      message: sanitized.message,
      bucket,
      path: cleanPath,
    });
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
 * Logs the final sanitized values of bucket and path immediately before the Supabase call.
 * Throws if upload fails, with clear logging identifying the path, bucket, status code, and error.
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

  // Production-safe diagnostics immediately before .upload()
  console.info('[Supabase upload target]', {
    bucket,
    path: cleanPath,
    pathLength: cleanPath.length,
    bucketLength: bucket.length,
    bucketJson: JSON.stringify(bucket),
    pathJson: JSON.stringify(cleanPath),
  });

  try {
    const { error } = await client.storage.from(bucket).upload(cleanPath, body, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert !== undefined ? options.upsert : true,
    });

    if (error) {
      const sanitized = sanitizeError(error);
      const status = (error as any).statusCode || (error as any).status;
      const errorName = (error as any).error || (error as any).name;
      console.error('[Supabase upload failure]', {
        statusCode: status,
        error: errorName,
        message: sanitized.message,
        bucket,
        path: cleanPath,
      });
      throw sanitized;
    }
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    const status = err?.statusCode || err?.status;
    const errorName = err?.error || err?.name;
    console.error('[Supabase upload failure]', {
      statusCode: status,
      error: errorName,
      message: sanitized.message,
      bucket,
      path: cleanPath,
    });
    throw sanitized;
  }
}

/**
 * Write a JSON payload to the private Supabase Storage bucket with upsert enabled.
 * Single boundary: prepares the serialized payload and delegates directly to uploadObject.
 */
export async function writeJson<T>(path: string, data: T): Promise<void> {
  const payload = JSON.stringify(data, null, 2);
  await uploadObject(path, payload, {
    contentType: 'application/json; charset=utf-8',
    upsert: true,
  });
}

/**
 * Write text or Lua script source to the private Supabase Storage bucket with upsert enabled.
 * Single boundary: delegates directly to uploadObject.
 */
export async function writeText(
  path: string,
  content: string,
  contentType: string = 'text/plain; charset=utf-8'
): Promise<void> {
  await uploadObject(path, content, {
    contentType,
    upsert: true,
  });
}

/**
 * Delete a single object from the private Supabase Storage bucket.
 * Logs the final sanitized values of bucket and path immediately before the Supabase call.
 * Throws a clear error if delete fails.
 */
export async function deleteObject(path: string): Promise<void> {
  await ensureStorageReady();
  const bucket = getSupabaseBucket();
  const cleanPath = validateStoragePath(path, bucket);
  const client = getSupabaseClient();

  // Production-safe diagnostics immediately before .remove()
  console.info('[Supabase delete target]', {
    bucket,
    path: cleanPath,
    pathLength: cleanPath.length,
    bucketLength: bucket.length,
    bucketJson: JSON.stringify(bucket),
    pathJson: JSON.stringify(cleanPath),
  });

  try {
    const { error } = await client.storage.from(bucket).remove([cleanPath]);
    if (error) {
      const sanitized = sanitizeError(error);
      const status = (error as any).statusCode || (error as any).status;
      const errorName = (error as any).error || (error as any).name;
      console.error('[Supabase delete failure]', {
        statusCode: status,
        error: errorName,
        message: sanitized.message,
        bucket,
        path: cleanPath,
      });
      throw sanitized;
    }
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    const status = err?.statusCode || err?.status;
    const errorName = err?.error || err?.name;
    console.error('[Supabase delete failure]', {
      statusCode: status,
      error: errorName,
      message: sanitized.message,
      bucket,
      path: cleanPath,
    });
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

  console.info('[Supabase bulk delete target]', {
    bucket,
    count: cleanPaths.length,
    paths: cleanPaths,
    bucketJson: JSON.stringify(bucket),
  });

  try {
    const { error } = await client.storage.from(bucket).remove(cleanPaths);
    if (error) {
      const sanitized = sanitizeError(error);
      const status = (error as any).statusCode || (error as any).status;
      const errorName = (error as any).error || (error as any).name;
      console.error('[Supabase bulk delete failure]', {
        statusCode: status,
        error: errorName,
        message: sanitized.message,
        bucket,
        paths: cleanPaths,
      });
      throw sanitized;
    }
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    const status = err?.statusCode || err?.status;
    const errorName = err?.error || err?.name;
    console.error('[Supabase bulk delete failure]', {
      statusCode: status,
      error: errorName,
      message: sanitized.message,
      bucket,
      paths: cleanPaths,
    });
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

  console.info(`[Supabase Storage:listObjects] Target bucket: "${bucket}", prefix: "${cleanPrefix}"`);

  try {
    const { data, error } = await client.storage.from(bucket).list(cleanPrefix, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      const sanitized = sanitizeError(error);
      console.error(
        `[Supabase Storage:listObjects] List failed for bucket "${bucket}", prefix "${cleanPrefix}":`,
        sanitized.message
      );
      throw sanitized;
    }

    return (data || []).map((item) => (cleanPrefix ? `${cleanPrefix}/${item.name}` : item.name));
  } catch (err: any) {
    const sanitized = sanitizeError(err);
    console.error(
      `[Supabase Storage:listObjects] List exception for bucket "${bucket}", prefix "${cleanPrefix}":`,
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

export interface StorageStepDiagnostic {
  path: string;
  bucket: string;
  bucketJson: string;
  pathJson: string;
  writeSuccess: boolean;
  readSuccess: boolean;
  deleteSuccess: boolean;
  readMatches: boolean;
  error?: {
    statusCode?: number | string;
    name?: string;
    message?: string;
  };
}

export interface StorageDiagnosticsReport {
  timestamp: string;
  environment: 'production-vercel' | 'development-or-emulator';
  bucket: string;
  bucketJson: string;
  step1RootTest: StorageStepDiagnostic;
  step2NestedTest?: StorageStepDiagnostic;
  overallSuccess: boolean;
  summary: string;
}

/**
 * Runs a minimal, non-destructive isolated test on Supabase Storage:
 * 1. Writes {"ok":true} to "diagnostics/write-test.json", reads back, deletes.
 * 2. If step 1 succeeds, writes {"ok":true} to "nova-hub/diagnostics/write-test.json", reads back, deletes.
 * Cleans up temporary objects in finally blocks. Never touches existing games/changelog/scripts data.
 */
export async function runStorageDiagnostics(): Promise<StorageDiagnosticsReport> {
  const bucket = getSupabaseBucket();
  const isVercel = process.env.VERCEL === '1';
  const environment = isVercel ? 'production-vercel' : 'development-or-emulator';

  // Step 1: Root write test "diagnostics/write-test.json"
  const step1Path = 'diagnostics/write-test.json';
  const step1: StorageStepDiagnostic = {
    path: step1Path,
    bucket,
    bucketJson: JSON.stringify(bucket),
    pathJson: JSON.stringify(step1Path),
    writeSuccess: false,
    readSuccess: false,
    deleteSuccess: false,
    readMatches: false,
  };

  const payload = { ok: true, timestamp: Date.now() };

  try {
    await writeJson(step1Path, payload);
    step1.writeSuccess = true;

    const readBack = await readJson<{ ok: boolean; timestamp: number }>(step1Path);
    step1.readSuccess = readBack !== null;
    step1.readMatches = Boolean(readBack && readBack.ok === true);
  } catch (err: any) {
    step1.error = {
      statusCode: err?.statusCode || err?.status,
      name: err?.name || err?.error,
      message: err?.message || String(err),
    };
  } finally {
    try {
      if (step1.writeSuccess) {
        await deleteObject(step1Path);
        step1.deleteSuccess = true;
      }
    } catch (delErr: any) {
      console.warn('[Storage Diagnostics] Step 1 cleanup delete warning:', delErr?.message || delErr);
    }
  }

  // Step 2: Nested write test "nova-hub/diagnostics/write-test.json" (only if Step 1 succeeded)
  let step2: StorageStepDiagnostic | undefined;
  if (step1.writeSuccess && step1.readMatches) {
    const step2Path = 'nova-hub/diagnostics/write-test.json';
    step2 = {
      path: step2Path,
      bucket,
      bucketJson: JSON.stringify(bucket),
      pathJson: JSON.stringify(step2Path),
      writeSuccess: false,
      readSuccess: false,
      deleteSuccess: false,
      readMatches: false,
    };

    try {
      await writeJson(step2Path, payload);
      step2.writeSuccess = true;

      const readBack2 = await readJson<{ ok: boolean; timestamp: number }>(step2Path);
      step2.readSuccess = readBack2 !== null;
      step2.readMatches = Boolean(readBack2 && readBack2.ok === true);
    } catch (err: any) {
      step2.error = {
        statusCode: err?.statusCode || err?.status,
        name: err?.name || err?.error,
        message: err?.message || String(err),
      };
    } finally {
      try {
        if (step2.writeSuccess) {
          await deleteObject(step2Path);
          step2.deleteSuccess = true;
        }
      } catch (delErr: any) {
        console.warn('[Storage Diagnostics] Step 2 cleanup delete warning:', delErr?.message || delErr);
      }
    }
  }

  let overallSuccess = false;
  let summary = '';

  if (!step1.writeSuccess) {
    overallSuccess = false;
    summary = `Root write test to "${step1Path}" failed in bucket "${bucket}" (${step1.error?.message || 'unknown error'}). The issue is in the base Storage write layer or Supabase configuration, below Games/Changelog code.`;
  } else if (!step2) {
    overallSuccess = false;
    summary = `Root write test to "${step1Path}" succeeded, but readback validation failed.`;
  } else if (!step2.writeSuccess) {
    overallSuccess = false;
    summary = `Root write test succeeded, but nested prefix test to "${step2.path}" failed (${step2.error?.message || 'unknown error'}). This proves the nested "nova-hub/" prefix inside bucket "${bucket}" is rejected by Supabase Storage.`;
  } else {
    overallSuccess = true;
    summary = `Both root ("${step1Path}") and nested ("${step2.path}") isolated tests succeeded completely and were cleaned up cleanly. Supabase Storage writes and nested prefixes are fully functional.`;
  }

  return {
    timestamp: new Date().toISOString(),
    environment,
    bucket,
    bucketJson: JSON.stringify(bucket),
    step1RootTest: step1,
    step2NestedTest: step2,
    overallSuccess,
    summary,
  };
}
