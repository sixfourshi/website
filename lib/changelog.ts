export * from './changelog-utils';

import { revalidatePath } from 'next/cache';
import { getStoredChangelog, saveStoredChangelog } from './storage';
import {
  type ChangelogRelease,
  type ChangelogSection,
  normalizeChangelogRelease,
  sortReleasesByPublishedDate,
} from './changelog-utils';

export async function getChangelogReleases(options?: { forceFresh?: boolean }): Promise<ChangelogRelease[]> {
  const rawReleases = await getStoredChangelog(options);
  if (!Array.isArray(rawReleases)) return [];
  const normalized = rawReleases.map(normalizeChangelogRelease);
  return sortReleasesByPublishedDate(normalized);
}

export async function upsertChangelogRelease(
  data: Partial<ChangelogRelease> & {
    version?: string;
    date?: string;
    publishedDate?: string;
    currentVersion?: string;
    summary?: string;
  }
): Promise<ChangelogRelease> {
  const releases = await getChangelogReleases({ forceFresh: true });
  const rawVersion = data.version ?? data.currentVersion ?? '';
  const version = typeof rawVersion === 'string' ? rawVersion.trim() : String(rawVersion).trim();
  const rawDate = data.date ?? data.publishedDate ?? data.releaseDate ?? '';
  const date = typeof rawDate === 'string' ? rawDate.trim() : String(rawDate).trim();
  const summary = (data.summary || '').trim();

  const id = data.id || `rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const existingIndex = releases.findIndex((r) => r.id === id);
  let updatedReleases: ChangelogRelease[] = [];
  let savedRelease: ChangelogRelease;

  const sections: ChangelogSection[] = (data.sections || []).map((sec, idx) => ({
    id: sec.id || `sec-${idx}-${Date.now()}`,
    title: (sec.title || 'GENERAL').trim().toUpperCase(),
    changes: Array.isArray(sec.changes)
      ? sec.changes.map((c) => String(c || '').trim()).filter(Boolean)
      : [],
  }));

  if (existingIndex >= 0) {
    const existing = releases[existingIndex];
    savedRelease = normalizeChangelogRelease({
      ...existing,
      ...data,
      id,
      version: version || existing.version,
      date: date || existing.date,
      summary: summary || existing.summary,
      sections,
      updatedAt: now,
    });
    updatedReleases = [...releases];
    updatedReleases[existingIndex] = savedRelease;
  } else {
    savedRelease = normalizeChangelogRelease({
      ...data,
      id,
      version,
      date,
      summary,
      isLatest: Boolean(data.isLatest),
      sections,
      createdAt: now,
      updatedAt: now,
    });
    updatedReleases = [savedRelease, ...releases];
  }

  // If marked as latest, ensure only this release has isLatest: true
  if (savedRelease.isLatest) {
    updatedReleases = updatedReleases.map((r) => ({
      ...r,
      isLatest: r.id === id,
    }));
  }

  // Sort by published date, newest first
  updatedReleases = sortReleasesByPublishedDate(updatedReleases).map((r, i) => ({
    ...r,
    order: i,
  }));

  await saveStoredChangelog(updatedReleases);

  try {
    revalidatePath('/');
    revalidatePath('/changelog');
    revalidatePath('/dashboard');
  } catch {}

  return savedRelease;
}

export async function deleteChangelogRelease(id: string): Promise<void> {
  const releases = await getChangelogReleases({ forceFresh: true });
  const filtered = releases.filter((r) => r.id !== id);
  const hadLatest = releases.find((r) => r.id === id)?.isLatest;
  if (hadLatest && filtered.length > 0) {
    filtered[0].isLatest = true;
  }
  await saveStoredChangelog(filtered);

  try {
    revalidatePath('/');
    revalidatePath('/changelog');
    revalidatePath('/dashboard');
  } catch {}
}

export async function markReleaseAsLatest(id: string): Promise<ChangelogRelease[]> {
  const releases = await getChangelogReleases({ forceFresh: true });
  const updated = releases.map((r) => ({
    ...r,
    isLatest: r.id === id,
  }));
  await saveStoredChangelog(updated);

  try {
    revalidatePath('/');
    revalidatePath('/changelog');
    revalidatePath('/dashboard');
  } catch {}

  return updated;
}

export async function reorderChangelogReleases(orderedIds: string[]): Promise<ChangelogRelease[]> {
  const releases = await getChangelogReleases({ forceFresh: true });
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

  try {
    revalidatePath('/');
    revalidatePath('/changelog');
    revalidatePath('/dashboard');
  } catch {}

  return reordered;
}


