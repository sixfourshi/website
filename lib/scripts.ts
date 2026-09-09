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
    if (Array.isArray(scripts) && scripts.length > 0) {
      return scripts;
    }
  } catch (err) {
    console.warn('[Scripts] Failed reading stored scripts:', err);
  }
  return [];
}

export async function getScriptsByGame(gameSlug: string): Promise<Script[]> {
  const scripts = await getScripts();
  return scripts.filter(
    (s) => s.game.toLowerCase() === gameSlug.toLowerCase()
  );
}

export async function getScript(slug: string): Promise<Script | undefined> {
  const scripts = await getScripts();
  return scripts.find((s) => s.slug.toLowerCase() === slug.toLowerCase());
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
