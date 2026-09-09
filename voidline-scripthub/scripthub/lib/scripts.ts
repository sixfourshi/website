import fs from 'fs/promises';
import path from 'path';

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
};

const DATA_PATH = path.join(process.cwd(), 'data', 'scripts.json');

export async function getScripts(): Promise<Script[]> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as Script[];
}

export async function getScript(slug: string): Promise<Script | undefined> {
  const scripts = await getScripts();
  return scripts.find((s) => s.slug === slug);
}

export async function saveScripts(scripts: Script[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(scripts, null, 2), 'utf-8');
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
  const scripts = await getScripts();
  const slug = existingSlug ?? slugify(input.name);
  const idx = scripts.findIndex((s) => s.slug === (existingSlug ?? slug));

  const record: Script = {
    slug,
    name: input.name,
    description: input.description ?? '',
    category: input.category ?? 'Utility',
    game: input.game ?? 'Universal',
    version: input.version ?? '1.0.0',
    updatedAt: new Date().toISOString().slice(0, 10),
    icon: input.icon ?? 'FileCode',
    code: input.code ?? '',
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
  await saveScripts(scripts.filter((s) => s.slug !== slug));
}
