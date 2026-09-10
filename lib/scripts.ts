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

export async function getScripts(): Promise<Script[]> {
  try {
    const scripts = await getStoredScripts();
    if (Array.isArray(scripts)) {
      return scripts;
    }
  } catch (err) {
    console.warn('[Scripts] Failed reading stored scripts:', err);
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

export async function getScript(slug: string): Promise<Script | undefined> {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).trim();
  const normalized = slugify(decoded);
  const scripts = await getScripts();
  return scripts.find(
    (s) =>
      slugify(s.slug) === normalized ||
      s.slug.toLowerCase() === decoded.toLowerCase() ||
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

export async function upsertScript(
  input: Partial<Script> & { name: string },
  existingSlug?: string
): Promise<Script> {
  if (!input.name || !input.name.trim()) {
    throw new ScriptValidationError('Script name is required.');
  }

  const scripts = await getScripts();
  const slug = existingSlug ?? (input.slug ? slugify(input.slug) : slugify(input.name));

  if (!slug) {
    throw new ScriptValidationError('A valid URL slug is required.');
  }

  // Prevent duplicate script slug
  const conflict = scripts.find(
    (s) =>
      s.slug.toLowerCase() === slug.toLowerCase() &&
      s.slug.toLowerCase() !== (existingSlug?.toLowerCase() ?? '')
  );
  if (conflict) {
    throw new ScriptValidationError(
      `A script with slug "${slug}" already exists ("${conflict.name}").`,
      409
    );
  }

  const idx = scripts.findIndex(
    (s) => s.slug.toLowerCase() === (existingSlug ?? slug).toLowerCase()
  );

  const record: Script = {
    slug,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    category: input.category?.trim() ?? 'Utility',
    game: (input.game?.trim() || 'universal').toLowerCase(),
    version: input.version?.trim() || '1.0.0',
    updatedAt: new Date().toISOString().slice(0, 10),
    icon: input.icon || 'FileCode',
    code: input.code ?? '',
    features: input.features ?? [],
  };

  if (idx >= 0) {
    scripts[idx] = record;
  } else {
    scripts.push(record);
  }

  await saveScripts(scripts);
  return record;
}

export async function deleteScript(slug: string): Promise<void> {
  const scripts = await getScripts();
  await saveScripts(scripts.filter((s) => s.slug.toLowerCase() !== slug.toLowerCase()));
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

