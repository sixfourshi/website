import { RobloxGame, ROBLOX_GAMES } from './games';
import { getScripts, saveScripts, slugify } from './scripts';
import { getStoredGames, saveStoredGames } from './storage';

export class GameValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'GameValidationError';
    this.statusCode = statusCode;
  }
}

export async function getGames(): Promise<RobloxGame[]> {
  try {
    const stored = await getStoredGames();
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  } catch (err) {
    console.warn('[Games] Failed to retrieve stored games, using fallback:', err);
  }
  return ROBLOX_GAMES;
}

export async function getGameBySlug(slug: string): Promise<RobloxGame | undefined> {
  const games = await getGames();
  return games.find((g) => g.slug.toLowerCase() === slug.toLowerCase());
}

export async function saveGames(games: RobloxGame[]): Promise<void> {
  await saveStoredGames(games);
}

export async function upsertGame(
  input: Partial<RobloxGame> & { name: string },
  existingSlug?: string
): Promise<RobloxGame> {
  if (!input.name || !input.name.trim()) {
    throw new GameValidationError('Game name is required.');
  }

  const games = await getGames();
  const slug = slugify(input.slug?.trim() || input.name);

  if (!slug) {
    throw new GameValidationError('A valid URL slug is required.');
  }

  // Prevent duplicate slug
  const slugConflict = games.find(
    (g) =>
      g.slug.toLowerCase() === slug.toLowerCase() &&
      g.slug.toLowerCase() !== (existingSlug?.toLowerCase() ?? '')
  );
  if (slugConflict) {
    throw new GameValidationError(
      `A game with the URL slug "${slug}" already exists ("${slugConflict.name}"). Please use a unique slug.`,
      409
    );
  }

  // Prevent duplicate Roblox Universe ID (unless universal)
  if (input.universeId && !input.isUniversal) {
    const uConflict = games.find(
      (g) =>
        g.universeId === input.universeId &&
        !g.isUniversal &&
        g.slug.toLowerCase() !== (existingSlug?.toLowerCase() ?? slug.toLowerCase())
    );
    if (uConflict) {
      throw new GameValidationError(
        `A game with Universe ID ${input.universeId} already exists ("${uConflict.name}").`,
        409
      );
    }
  }

  // Prevent duplicate Roblox Root Place ID (unless universal)
  if (input.rootPlaceId && !input.isUniversal) {
    const pConflict = games.find(
      (g) =>
        g.rootPlaceId === input.rootPlaceId &&
        !g.isUniversal &&
        g.slug.toLowerCase() !== (existingSlug?.toLowerCase() ?? slug.toLowerCase())
    );
    if (pConflict) {
      throw new GameValidationError(
        `A game with Place ID ${input.rootPlaceId} already exists ("${pConflict.name}").`,
        409
      );
    }
  }

  const idx = games.findIndex(
    (g) => g.slug.toLowerCase() === (existingSlug?.toLowerCase() ?? slug.toLowerCase())
  );

  const record: RobloxGame = {
    slug,
    name: input.name.trim(),
    universeId: input.universeId !== undefined && input.universeId !== null ? Number(input.universeId) : null,
    rootPlaceId: input.rootPlaceId ? Number(input.rootPlaceId) : undefined,
    description: input.description?.trim() ?? '',
    iconUrl: input.iconUrl?.trim() ?? '',
    thumbnailUrl: input.thumbnailUrl?.trim() ?? '',
    isUniversal: Boolean(input.isUniversal),
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
  const nextGames = games.filter((g) => g.slug.toLowerCase() !== slug.toLowerCase());
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
