import { revalidatePath } from 'next/cache';
import {
  getStoredSuggestions,
  saveStoredSuggestions,
  type Suggestion,
  type SuggestionStatus,
} from './storage';

export type { Suggestion, SuggestionStatus };

export interface SuggestionInput {
  gameName: string;
  robloxLink: string;
  suggestion: string;
}

/**
 * Strips dangerous HTML tags, angle brackets, and control characters to prevent stored XSS.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Strip control chars
    .trim();
}

/**
 * Validates that the submitted link is a genuine Roblox experience URL or Place ID.
 * Supports full URLs (roblox.com/games/...) as well as numeric Place IDs sent by Roblox scripts.
 */
export function isValidRobloxGameUrl(urlStr: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, error: 'Roblox game link or Place ID is required.' };
  }

  let trimmed = urlStr.trim();

  // Support numeric Place ID directly (e.g. "2753915549" or "games/2753915549")
  const numericMatch = trimmed.match(/^(\d{4,16})$/);
  if (numericMatch) {
    return {
      valid: true,
      normalized: `https://www.roblox.com/games/${numericMatch[1]}`,
    };
  }

  const shortGamesMatch = trimmed.match(/^(?:\/)?games\/(\d{4,16})/i);
  if (shortGamesMatch) {
    return {
      valid: true,
      normalized: `https://www.roblox.com/games/${shortGamesMatch[1]}`,
    };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const approvedDomains = ['roblox.com', 'www.roblox.com', 'web.roblox.com'];
    if (!approvedDomains.includes(hostname)) {
      return {
        valid: false,
        error: 'URL must be from an approved Roblox domain (roblox.com, www.roblox.com, or web.roblox.com).',
      };
    }

    const pathname = parsed.pathname.toLowerCase();
    if (!pathname.startsWith('/games/')) {
      return {
        valid: false,
        error: 'Roblox URL must point directly to a game experience (e.g., https://www.roblox.com/games/13772394625/...).',
      };
    }

    // Must contain numeric place ID
    const match = pathname.match(/^\/games\/(\d+)/);
    if (!match || !match[1]) {
      return {
        valid: false,
        error: 'Roblox game link must contain a valid numeric Place ID in /games/[placeId].',
      };
    }

    return { valid: true, normalized: trimmed };
  } catch {
    return { valid: false, error: 'Please enter a valid Roblox game URL.' };
  }
}

/**
 * Validates all fields of a suggestion submission payload.
 * Accommodates payloads from both the website form and in-game Roblox scripts.
 */
export function validateSuggestionInput(data: unknown): {
  valid: boolean;
  sanitized?: SuggestionInput;
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid submission format.' };
  }

  const raw = data as Record<string, unknown>;

  // Flexible field resolution for game name
  const rawGameName = sanitizeInput(
    raw.gameName ?? raw.game ?? raw.game_name ?? raw.title
  );

  // Flexible field resolution for Roblox link / Place ID
  let rawLinkValue =
    raw.robloxLink ??
    raw.roblox_link ??
    raw.link ??
    raw.url ??
    raw.gameUrl ??
    raw.gameLink;

  if (
    (!rawLinkValue || typeof rawLinkValue !== 'string') &&
    raw.placeId !== undefined &&
    raw.placeId !== null
  ) {
    rawLinkValue = String(raw.placeId);
  }

  const rawRobloxLink = sanitizeInput(
    typeof rawLinkValue === 'number' ? String(rawLinkValue) : rawLinkValue
  );

  // Flexible field resolution for suggestion text
  const rawSuggestion = sanitizeInput(
    raw.suggestion ?? raw.text ?? raw.message ?? raw.description ?? raw.feedback
  );

  if (!rawGameName) {
    return { valid: false, error: 'Game Name is required.' };
  }
  if (rawGameName.length < 2) {
    return { valid: false, error: 'Game Name must be at least 2 characters.' };
  }
  if (rawGameName.length > 100) {
    return { valid: false, error: 'Game Name cannot exceed 100 characters.' };
  }

  const urlCheck = isValidRobloxGameUrl(rawRobloxLink);
  if (!urlCheck.valid || !urlCheck.normalized) {
    return { valid: false, error: urlCheck.error || 'Please enter a valid Roblox game URL or Place ID.' };
  }
  if (urlCheck.normalized.length > 300) {
    return { valid: false, error: 'Roblox game URL is too long (maximum 300 characters).' };
  }

  if (!rawSuggestion) {
    return { valid: false, error: 'Suggestion text is required.' };
  }
  if (rawSuggestion.length < 5) {
    return { valid: false, error: 'Please enter at least 5 characters for your suggestion.' };
  }
  if (rawSuggestion.length > 2000) {
    return { valid: false, error: 'Suggestion cannot exceed 2000 characters.' };
  }

  return {
    valid: true,
    sanitized: {
      gameName: rawGameName,
      robloxLink: urlCheck.normalized,
      suggestion: rawSuggestion,
    },
  };
}

// In-memory sliding-window rate limiter per client IP
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 suggestions per 10 minutes

/**
 * Server-side rate limiter to prevent spam submissions.
 */
export function checkRateLimit(clientIp: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record) {
    rateLimitMap.set(clientIp, { timestamps: [now] });
    return { allowed: true };
  }

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  record.timestamps.push(now);
  return { allowed: true };
}

/**
 * Persistently save a new suggestion to Supabase Storage.
 */
export async function submitSuggestion(input: SuggestionInput): Promise<Suggestion> {
  const existing = await getStoredSuggestions();

  const newSuggestion: Suggestion = {
    id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    gameName: input.gameName,
    robloxLink: input.robloxLink,
    suggestion: input.suggestion,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Prepend to list
  const updated = [newSuggestion, ...existing];
  await saveStoredSuggestions(updated);

  try {
    revalidatePath('/dashboard');
    revalidatePath('/suggestion');
  } catch {
    // Non-critical revalidate error
  }

  return newSuggestion;
}

/**
 * Retrieve all suggestions sorted by newest first.
 */
export async function getSuggestionsList(): Promise<Suggestion[]> {
  const list = await getStoredSuggestions();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Update the status of a suggestion persistently.
 */
export async function updateSuggestionStatus(
  id: string,
  newStatus: SuggestionStatus
): Promise<Suggestion | null> {
  const list = await getStoredSuggestions();
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  await saveStoredSuggestions(list);

  try {
    revalidatePath('/dashboard');
  } catch {
    // Non-critical revalidate error
  }

  return list[index];
}

/**
 * Delete a suggestion permanently from persistent storage.
 */
export async function deleteSuggestion(id: string): Promise<boolean> {
  const list = await getStoredSuggestions();
  const filtered = list.filter((s) => s.id !== id);
  if (filtered.length === list.length) return false;

  await saveStoredSuggestions(filtered);

  try {
    revalidatePath('/dashboard');
  } catch {
    // Non-critical revalidate error
  }

  return true;
}
