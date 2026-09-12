export interface ChangelogSection {
  id: string;
  title: string;
  changes: string[];
}

export interface ChangelogRelease {
  id: string;
  version: string;
  date: string; // e.g. "2026-09-06" or "DD/MM/YYYY"
  publishedDate?: string; // alias for compatibility
  releaseDate?: string;   // alias for compatibility
  currentVersion?: string; // alias for compatibility
  summary: string;
  isLatest: boolean;
  sections: ChangelogSection[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Safely parses any date string format into a millisecond timestamp.
 * Handles:
 * - YYYY-MM-DD / YYYY/MM/DD (with optional time)
 * - DD/MM/YYYY / DD-MM-YYYY (with optional time)
 * - ISO-8601 strings
 * - Standard Date.parse strings
 * Returns 0 if invalid or unparseable.
 */
export function parseChangelogDateToTimestamp(dateStr?: string | null): number {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const trimmed = dateStr.trim();
  if (!trimmed) return 0;

  // 1. Check YYYY-MM-DD or YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const hour = ymd[4] ? parseInt(ymd[4], 10) : 0;
    const min = ymd[5] ? parseInt(ymd[5], 10) : 0;
    const sec = ymd[6] ? parseInt(ymd[6], 10) : 0;
    return Date.UTC(year, month, day, hour, min, sec);
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const hour = dmy[4] ? parseInt(dmy[4], 10) : 0;
    const min = dmy[5] ? parseInt(dmy[5], 10) : 0;
    const sec = dmy[6] ? parseInt(dmy[6], 10) : 0;
    return Date.UTC(year, month, day, hour, min, sec);
  }

  // 3. Fallback to standard JS Date.parse
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return 0;
}

/**
 * Formats a release date as DD/MM/YYYY (e.g. 06/09/2026, 20/10/2026).
 * Never returns relative text like "1 day ago".
 * Returns '—' only if no date exists or date is invalid.
 */
export function formatChangelogDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const trimmed = dateStr.trim();
  if (!trimmed) return '—';

  // Quick match DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${day}/${month}/${year}`;
  }

  // Quick match YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const timestamp = parseChangelogDateToTimestamp(trimmed);
  if (timestamp > 0) {
    const d = new Date(timestamp);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  return '—';
}

/**
 * Formats a changelog version, e.g. "v3.0.4".
 * If it already starts with 'v' or 'V', standardizes to lowercase 'v'.
 * Returns '—' only if version is genuinely missing or empty.
 */
export function formatChangelogVersion(versionStr?: string | null): string {
  if (!versionStr || typeof versionStr !== 'string') return '—';
  const trimmed = versionStr.trim();
  if (!trimmed) return '—';
  if (/^v/i.test(trimmed)) {
    return `v${trimmed.replace(/^v/i, '')}`;
  }
  return `v${trimmed}`;
}

/**
 * Normalizes a raw changelog entry from storage or API:
 * Ensures both `date` and `publishedDate` exist, and both `version` and `currentVersion` exist.
 */
export function normalizeChangelogRelease(raw: any): ChangelogRelease {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `rel-${Date.now()}`,
      version: '',
      currentVersion: '',
      date: '',
      publishedDate: '',
      releaseDate: '',
      summary: '',
      isLatest: false,
      sections: [],
    };
  }

  const rawVersion = raw.version ?? raw.currentVersion ?? raw.versionNumber ?? raw.ver ?? '';
  const version = typeof rawVersion === 'string' ? rawVersion.trim() : String(rawVersion || '').trim();

  const rawDate = raw.date ?? raw.publishedDate ?? raw.published_date ?? raw.releaseDate ?? raw.release_date ?? raw.createdAt ?? '';
  const date = typeof rawDate === 'string' ? rawDate.trim() : String(rawDate || '').trim();

  const sections: ChangelogSection[] = Array.isArray(raw.sections)
    ? raw.sections.map((s: any, idx: number) => ({
        id: s?.id || `sec-${idx}-${Date.now()}`,
        title: (s?.title || 'GENERAL').toString().trim().toUpperCase(),
        changes: Array.isArray(s?.changes)
          ? s.changes.map((c: any) => String(c || '').trim()).filter(Boolean)
          : [],
      }))
    : [];

  return {
    ...raw,
    id: raw.id || `rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    version,
    currentVersion: version,
    date,
    publishedDate: date,
    releaseDate: date,
    summary: (raw.summary || '').toString().trim(),
    isLatest: Boolean(raw.isLatest),
    sections,
    order: typeof raw.order === 'number' ? raw.order : undefined,
    createdAt: raw.createdAt || (date ? new Date(parseChangelogDateToTimestamp(date)).toISOString() : undefined),
    updatedAt: raw.updatedAt,
  };
}

/**
 * Sorts changelog releases by their actual published date, newest first.
 * If dates are identical, uses updatedAt / createdAt as tie-breaker.
 */
export function sortReleasesByPublishedDate(releases: ChangelogRelease[]): ChangelogRelease[] {
  if (!Array.isArray(releases)) return [];
  return [...releases].sort((a, b) => {
    const timeA = parseChangelogDateToTimestamp(a.date || a.publishedDate || a.releaseDate);
    const timeB = parseChangelogDateToTimestamp(b.date || b.publishedDate || b.releaseDate);
    if (timeA !== timeB) {
      return timeB - timeA; // newest date first
    }
    const upA = parseChangelogDateToTimestamp(a.updatedAt || a.createdAt);
    const upB = parseChangelogDateToTimestamp(b.updatedAt || b.createdAt);
    if (upA !== upB) {
      return upB - upA;
    }
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return 0;
  });
}

/**
 * Resolves the newest published changelog release strictly sorted by published date (newest first).
 * Does not rely on hardcoded fallback values or `isLatest` flag.
 * Returns undefined only if there are genuinely no changelog entries.
 */
export function getNewestPublishedRelease(releases: ChangelogRelease[]): ChangelogRelease | undefined {
  if (!Array.isArray(releases) || releases.length === 0) return undefined;

  const validReleases = releases
    .map(normalizeChangelogRelease)
    .filter((r) => r.version.length > 0 || r.date.length > 0);

  if (validReleases.length === 0) return undefined;

  const sorted = sortReleasesByPublishedDate(validReleases);
  return sorted[0];
}

/**
 * Backwards compatibility alias for getNewestPublishedRelease.
 * Sorts changelog entries by their actual published date, newest first.
 */
export function getActiveLatestRelease(releases: ChangelogRelease[]): ChangelogRelease | undefined {
  return getNewestPublishedRelease(releases);
}

export const INITIAL_CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    id: 'rel-9-6-26',
    version: 'v9.6.26',
    currentVersion: 'v9.6.26',
    date: '2026-09-06',
    publishedDate: '2026-09-06',
    releaseDate: '2026-09-06',
    summary: 'Lobby quality-of-life improvements and smarter automation.',
    isLatest: true,
    sections: [
      {
        id: 'sec-lobby',
        title: 'LOBBY',
        changes: [
          'Auto Sell now has separate rarity lists.',
          'Added improved item protection rules.',
        ],
      },
      {
        id: 'sec-movement',
        title: 'MOVEMENT',
        changes: [
          'Improved movement stability.',
        ],
      },
    ],
  },
  {
    id: 'rel-2-4-0',
    version: 'v2.4.0',
    currentVersion: 'v2.4.0',
    date: '2026-08-28',
    publishedDate: '2026-08-28',
    releaseDate: '2026-08-28',
    summary: 'Major optimization release featuring an overhauled single-line loader with sub-second cold starts and direct bytecode caching.',
    isLatest: false,
    sections: [
      {
        id: 'sec-loader',
        title: 'LOADER & CORE',
        changes: [
          'Optimized loader payload: 42% reduced execution overhead across all supported executors.',
          'Added individual versioned raw endpoints (/api/raw/[slug]) for zero-friction script imports.',
          'Patched teleport desync detection on Roblox latest security update.',
        ],
      },
      {
        id: 'sec-macros',
        title: 'MACROS',
        changes: [
          'Added Nightfall Macro automated sequence engine with step debugger.',
        ],
      },
    ],
  },
  {
    id: 'rel-2-0-0',
    version: 'v2.0.0',
    currentVersion: 'v2.0.0',
    date: '2026-06-10',
    publishedDate: '2026-06-10',
    releaseDate: '2026-06-10',
    summary: 'Sour Hub 2.0 release: permanent transition to 100% keyless architecture with zero linkvertise barriers and raw loadstring endpoints.',
    isLatest: false,
    sections: [
      {
        id: 'sec-platform',
        title: 'PLATFORM',
        changes: [
          'Complete keyless infrastructure launch — no ads, checkpoints, or keys forever.',
          'Unified single-line universal loader format.',
          'Modular script core architecture with dynamic loading.',
        ],
      },
    ],
  },
];
