import { getStoredScripts, saveStoredScripts } from './storage';

export type Script = {
  slug: string;
  name: string;
  description: string;
  category: string;
  game: string;
  version: string;
  updatedAt: string;
  icon: string;
  code: string;
  features?: string[];
};

export class ScriptValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ScriptValidationError';
    this.statusCode = statusCode;
  }
}

export async function getScripts(options?: { forceFresh?: boolean }): Promise<Script[]> {
  const scripts = await getStoredScripts(options);
  if (Array.isArray(scripts)) {
    return scripts;
  }
  return [];
}

export async function getScriptsByGame(gameSlug: string): Promise<Script[]> {
  if (!gameSlug) return [];
  const normalized = slugify(decodeURIComponent(gameSlug).trim());
  const scripts = await getScripts();
  return scripts.filter((s) => {
    const sGameNorm = slugify(s.game);
    return sGameNorm === normalized || s.game.toLowerCase() === gameSlug.toLowerCase();
  });
}

export async function getScript(
  slug: string,
  options?: { forceFresh?: boolean }
): Promise<Script | undefined> {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).trim();
  const normalized = slugify(decoded);
  const scripts = await getScripts(options);
  return scripts.find(
    (s) =>
      s.slug.toLowerCase() === decoded.toLowerCase() ||
      slugify(s.slug) === normalized ||
      slugify(s.name) === normalized
  );
}

export async function saveScripts(scripts: Script[]): Promise<void> {
  await saveStoredScripts(scripts);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// In-memory Promise chain mutex to serialize all concurrent script mutations (prevents lost updates)
let scriptMutationLock: Promise<any> = Promise.resolve();

export async function runWithScriptsLock<T>(action: () => Promise<T>): Promise<T> {
  const currentLock = scriptMutationLock.then(
    () => action(),
    () => action()
  );
  scriptMutationLock = currentLock.catch(() => {});
  return currentLock;
}

export async function upsertScript(
  input: Partial<Script> & { name: string },
  existingSlug?: string
): Promise<Script> {
  if (!input.name || !input.name.trim()) {
    throw new ScriptValidationError('Script name is required.');
  }

  return runWithScriptsLock(async () => {
    // Always read latest fresh scripts directly from persistent storage
    const scripts = await getScripts({ forceFresh: true });

    let slug: string;
    let idx = -1;

    if (existingSlug) {
      // PERMANENT SLUG PRESERVATION WHEN EDITING (Requirement 6)
      slug = existingSlug;
      idx = scripts.findIndex(
        (s) => s.slug.toLowerCase() === existingSlug.toLowerCase()
      );
      if (idx < 0) {
        throw new ScriptValidationError(`Script "${existingSlug}" not found.`, 404);
      }
    } else {
      // NEW SCRIPT CREATION: generate unique slug without modifying existing scripts (Requirement 6)
      let baseSlug = input.slug ? slugify(input.slug) : slugify(input.name);
      if (!baseSlug) {
        baseSlug = 'script';
      }
      slug = baseSlug;
      let counter = 2;
      while (scripts.some((s) => s.slug.toLowerCase() === slug.toLowerCase())) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const existingRecord = idx >= 0 ? scripts[idx] : null;

    const record: Script = {
      slug,
      name: input.name.trim(),
      description: input.description !== undefined ? input.description.trim() : (existingRecord?.description ?? ''),
      category: input.category !== undefined ? input.category.trim() : (existingRecord?.category ?? 'Utility'),
      game: (input.game !== undefined ? input.game.trim() : (existingRecord?.game ?? 'universal')).toLowerCase(),
      version: input.version !== undefined ? input.version.trim() : (existingRecord?.version ?? '1.0.0'),
      updatedAt: new Date().toISOString().slice(0, 10),
      icon: input.icon || existingRecord?.icon || 'FileCode',
      code: input.code !== undefined ? input.code : (existingRecord?.code ?? ''),
      features: input.features ?? existingRecord?.features ?? [],
    };

    if (idx >= 0) {
      // Update ONLY the matching script, preserve every other script (Requirement 2)
      scripts[idx] = record;
    } else {
      // Append the new script without removing existing scripts (Requirement 1)
      scripts.push(record);
    }

    // Write the COMPLETE updated scripts collection back to persistent storage & verify (Requirement 1 & 2)
    await saveScripts(scripts);
    return record;
  });
}

export async function deleteScript(slug: string): Promise<void> {
  if (!slug || !slug.trim()) {
    throw new ScriptValidationError('Script slug is required.');
  }
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  return runWithScriptsLock(async () => {
    // Read latest persistent data (Requirement 3)
    const scripts = await getScripts({ forceFresh: true });
    const idx = scripts.findIndex((s) => s.slug.toLowerCase() === cleanSlug);
    if (idx < 0) {
      throw new ScriptValidationError(`Script "${slug}" not found.`, 404);
    }

    // Remove only the requested script, preserving all other scripts (Requirement 3)
    const remaining = scripts.filter((s) => s.slug.toLowerCase() !== cleanSlug);

    // Persist the complete result back to persistent storage (Requirement 3)
    await saveScripts(remaining);
  });
}

export async function deleteScripts(slugs: string[]): Promise<string[]> {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return [];
  }
  const cleanSlugs = new Set(
    slugs.map((s) => decodeURIComponent(s).trim().toLowerCase()).filter(Boolean)
  );
  if (cleanSlugs.size === 0) return [];

  return runWithScriptsLock(async () => {
    const scripts = await getScripts({ forceFresh: true });
    const remaining = scripts.filter((s) => !cleanSlugs.has(s.slug.toLowerCase()));
    await saveScripts(remaining);
    return Array.from(cleanSlugs);
  });
}

export function formatRelativeTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '1 day ago';

  let date: Date;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    date = new Date(year, month - 1, day, 12, 0, 0);
  } else {
    date = new Date(dateInput);
  }

  const timestamp = date.getTime();
  if (isNaN(timestamp)) return '1 day ago';

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return 'Just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return diffMin === 1 ? '1m ago' : `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1hr ago' : `${diffHours}hrs ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return '1 day ago';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }

  return `${Math.floor(diffDays / 365)}y ago`;
}

