export interface ChangelogSection {
  id: string;
  title: string;
  changes: string[];
}

export interface ChangelogRelease {
  id: string;
  version: string;
  date: string; // e.g. "2026-09-06"
  summary: string;
  isLatest: boolean;
  sections: ChangelogSection[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    id: 'rel-9-6-26',
    version: 'v9.6.26',
    date: '2026-09-06',
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
    date: '2026-08-28',
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
    date: '2026-06-10',
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

import { getStoredChangelog, saveStoredChangelog } from './storage';

export async function getChangelogReleases(options?: { forceFresh?: boolean }): Promise<ChangelogRelease[]> {
  const releases = await getStoredChangelog(options);
  // Sort by order ascending if specified, or default to release date newest first
  return [...releases].sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function upsertChangelogRelease(
  data: Partial<ChangelogRelease> & { version: string; date: string; summary: string }
): Promise<ChangelogRelease> {
  const releases = await getChangelogReleases();
  const id = data.id || `rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const existingIndex = releases.findIndex((r) => r.id === id);
  let updatedReleases: ChangelogRelease[] = [];
  let savedRelease: ChangelogRelease;

  const sections: ChangelogSection[] = (data.sections || []).map((sec, idx) => ({
    id: sec.id || `sec-${idx}-${Date.now()}`,
    title: (sec.title || 'GENERAL').trim(),
    changes: Array.isArray(sec.changes)
      ? sec.changes.map((c) => c.trim()).filter(Boolean)
      : [],
  }));

  if (existingIndex >= 0) {
    const existing = releases[existingIndex];
    savedRelease = {
      ...existing,
      ...data,
      id,
      sections,
      updatedAt: now,
    };
    updatedReleases = [...releases];
    updatedReleases[existingIndex] = savedRelease;
  } else {
    savedRelease = {
      id,
      version: data.version.trim(),
      date: data.date.trim(),
      summary: data.summary.trim(),
      isLatest: Boolean(data.isLatest),
      sections,
      order: typeof data.order === 'number' ? data.order : 0,
      createdAt: now,
      updatedAt: now,
    };
    // Prepend new release at top (order 0)
    updatedReleases = [savedRelease, ...releases.map((r, i) => ({ ...r, order: i + 1 }))];
  }

  // If marked as latest, ensure only this release has isLatest: true
  if (savedRelease.isLatest) {
    updatedReleases = updatedReleases.map((r) => ({
      ...r,
      isLatest: r.id === id,
    }));
  }

  await saveStoredChangelog(updatedReleases);
  return savedRelease;
}

export async function deleteChangelogRelease(id: string): Promise<void> {
  const releases = await getChangelogReleases();
  const filtered = releases.filter((r) => r.id !== id);
  // If the deleted one was latest, mark the first release as latest if available
  const hadLatest = releases.find((r) => r.id === id)?.isLatest;
  if (hadLatest && filtered.length > 0) {
    filtered[0].isLatest = true;
  }
  await saveStoredChangelog(filtered);
}

export async function markReleaseAsLatest(id: string): Promise<ChangelogRelease[]> {
  const releases = await getChangelogReleases();
  const updated = releases.map((r) => ({
    ...r,
    isLatest: r.id === id,
  }));
  await saveStoredChangelog(updated);
  return updated;
}

export async function reorderChangelogReleases(orderedIds: string[]): Promise<ChangelogRelease[]> {
  const releases = await getChangelogReleases();
  const idMap = new Map(releases.map((r) => [r.id, r]));
  const reordered: ChangelogRelease[] = [];

  orderedIds.forEach((id, index) => {
    const r = idMap.get(id);
    if (r) {
      reordered.push({ ...r, order: index });
      idMap.delete(id);
    }
  });

  // Append any remainder
  idMap.forEach((r) => {
    reordered.push({ ...r, order: reordered.length });
  });

  await saveStoredChangelog(reordered);
  return reordered;
}

/**
 * Resolves the active latest release:
 * - If a release is marked isLatest === true, prefer that release.
 * - Otherwise sort releases by real date (newest first) and use the first one.
 */
export function getActiveLatestRelease(releases: ChangelogRelease[]): ChangelogRelease | undefined {
  if (!releases || releases.length === 0) return undefined;

  const markedLatest = releases.find((r) => r.isLatest);
  if (markedLatest) {
    return markedLatest;
  }

  const sortedByDate = [...releases].sort((a, b) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  return sortedByDate[0];
}

/**
 * Formats a release date as DD/MM/YYYY (e.g. 20/10/2026).
 * Returns '—' if no date exists or date is invalid.
 */
export function formatChangelogDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '—';

  const trimmed = dateStr.trim();
  // Match YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Match DD/MM/YYYY already
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return '—';
  }

  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const year = parsed.getUTCFullYear();
  return `${day}/${month}/${year}`;
}


