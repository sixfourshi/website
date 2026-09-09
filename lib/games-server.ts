import fs from 'fs/promises';
import path from 'path';
import { RobloxGame, ROBLOX_GAMES } from './games';
import { getScripts, saveScripts, slugify } from './scripts';

const GAMES_DATA_PATH = path.join(process.cwd(), 'data', 'games.json');

export async function getGames(): Promise<RobloxGame[]> {
  try {
    const raw = await fs.readFile(GAMES_DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as RobloxGame[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // If file doesn't exist or is invalid, seed it with default games
    try {
      await saveGames(ROBLOX_GAMES);
    } catch {}
  }
  return ROBLOX_GAMES;
}

export async function getGameBySlug(slug: string): Promise<RobloxGame | undefined> {
  const games = await getGames();
  return games.find((g) => g.slug.toLowerCase() === slug.toLowerCase());
}

export async function saveGames(games: RobloxGame[]): Promise<void> {
  await fs.writeFile(GAMES_DATA_PATH, JSON.stringify(games, null, 2), 'utf-8');
}

export async function upsertGame(
  input: Partial<RobloxGame> & { name: string },
  existingSlug?: string
): Promise<RobloxGame> {
  const games = await getGames();
  const slug = existingSlug ?? (input.slug ? slugify(input.slug) : slugify(input.name));
  const idx = games.findIndex((g) => g.slug === (existingSlug ?? slug));

  const record: RobloxGame = {
    slug,
    name: input.name,
    universeId: input.universeId !== undefined ? input.universeId : null,
    rootPlaceId: input.rootPlaceId,
    description: input.description ?? '',
    iconUrl: input.iconUrl ?? '',
    thumbnailUrl: input.thumbnailUrl ?? '',
    isUniversal: input.isUniversal ?? false,
    featuresCount: typeof input.featuresCount === 'number' ? input.featuresCount : 10,
  };

  if (idx >= 0) {
    games[idx] = record;
  } else {
    games.push(record);
  }

  await saveGames(games);
  return record;
}

export type DeleteGameScriptAction = 'keep' | 'reassign' | 'delete';

export async function deleteGame(
  slug: string,
  scriptAction: DeleteGameScriptAction = 'reassign'
): Promise<{ deletedGame: string; scriptsAffected: number }> {
  const games = await getGames();
  const nextGames = games.filter((g) => g.slug !== slug);
  await saveGames(nextGames);

  // Handle associated scripts
  const scripts = await getScripts();
  let scriptsAffected = 0;

  if (scriptAction === 'delete') {
    const remaining = scripts.filter((s) => {
      const match = s.game.toLowerCase() === slug.toLowerCase();
      if (match) scriptsAffected++;
      return !match;
    });
    await saveScripts(remaining);
  } else if (scriptAction === 'reassign') {
    const updated = scripts.map((s) => {
      if (s.game.toLowerCase() === slug.toLowerCase()) {
        scriptsAffected++;
        return { ...s, game: 'universal' };
      }
      return s;
    });
    await saveScripts(updated);
  } else {
    // 'keep' - leave scripts with their existing game slug
    scriptsAffected = scripts.filter(
      (s) => s.game.toLowerCase() === slug.toLowerCase()
    ).length;
  }

  return { deletedGame: slug, scriptsAffected };
}
