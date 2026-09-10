import { RobloxGame, ROBLOX_GAMES, normalizeGame } from './games';
import { slugify } from './scripts';
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
    if (Array.isArray(stored)) {
      return stored.map((g) => normalizeGame(g));
    }
  } catch (err) {
    console.warn('[Games] Failed to retrieve stored games, using fallback:', err);
  }
  return ROBLOX_GAMES.map((g) => normalizeGame(g));
}

export async function getGameBySlug(slug: string): Promise<RobloxGame | undefined> {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).trim();
  const normalized = slugify(decoded);
  const games = await getGames();
  return games.find((g) => {
    const gSlug = slugify(g.slug);
    return (
      gSlug === normalized ||
      g.slug.toLowerCase() === decoded.toLowerCase() ||
      slugify(g.name) === normalized
    );
  });
}

export async function saveGames(games: RobloxGame[]): Promise<void> {
  const normalized = games.map((g) => normalizeGame(g));
  await saveStoredGames(normalized);
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

  const cleanGame = normalizeGame({
    ...input,
    slug,
    name: input.name.trim(),
    universeId: input.universeId !== undefined && input.universeId !== null ? Number(input.universeId) : null,
    rootPlaceId: input.rootPlaceId ? Number(input.rootPlaceId) : undefined,
    iconUrl: input.iconUrl?.trim() ?? '',
    thumbnailUrl: input.thumbnailUrl?.trim() ?? '',
    isUniversal: Boolean(input.isUniversal),
    tabs: input.tabs,
  });

  if (idx >= 0) {
    games[idx] = cleanGame;
  } else {
    games.push(cleanGame);
  }

  await saveGames(games);
  return cleanGame;
}

export type DeleteGameScriptAction = 'keep' | 'reassign' | 'delete';

export async function deleteGame(
  slug: string,
  scriptAction: DeleteGameScriptAction = 'reassign'
): Promise<{ deletedGame: string }> {
  const games = await getGames();
  const nextGames = games.filter((g) => g.slug.toLowerCase() !== slug.toLowerCase());
  await saveGames(nextGames);
  return { deletedGame: slug };
}
