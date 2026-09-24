export interface GameSection {
  name: string;
  features: string[];
}

export interface GameTab {
  name: string;
  sections: GameSection[];
}

export interface RobloxGame {
  slug: string;
  name: string;
  universeId: number | null;
  rootPlaceId?: number;
  iconUrl: string;
  thumbnailUrl: string;
  isUniversal?: boolean;
  tabs: GameTab[];
  featuresCount?: number;
}

export const ROBLOX_GAMES: RobloxGame[] = [];


export function countGameFeatures(game: { tabs?: GameTab[]; featuresCount?: number }): number {
  if (Array.isArray(game.tabs) && game.tabs.length > 0) {
    return game.tabs.reduce(
      (total, tab) =>
        total +
        (Array.isArray(tab.sections)
          ? tab.sections.reduce(
              (sTotal, sec) => sTotal + (Array.isArray(sec.features) ? sec.features.length : 0),
              0
            )
          : 0),
      0
    );
  }
  return typeof game.featuresCount === 'number' ? game.featuresCount : 0;
}

/**
 * Normalizes any raw game object (legacy or new) to guarantee the
 * tabs -> sections -> features structure without losing information.
 */
export function normalizeGame(raw: any): RobloxGame {
  const slug = String(raw.slug || '').trim().toLowerCase();
  const name = String(raw.name || '').trim() || 'Untitled Game';

  // If tabs already exist and are populated
  if (Array.isArray(raw.tabs) && raw.tabs.length > 0) {
    const cleanTabs: GameTab[] = raw.tabs
      .filter((t: any) => t && typeof t.name === 'string')
      .map((t: any) => ({
        name: String(t.name).trim() || 'General',
        sections: (Array.isArray(t.sections) ? t.sections : [])
          .filter((s: any) => s && typeof s.name === 'string')
          .map((s: any) => ({
            name: String(s.name).trim() || 'Features',
            features: (Array.isArray(s.features) ? s.features : [])
              .map((f: any) => String(f).trim())
              .filter(Boolean),
          })),
      }));

    const game: RobloxGame = {
      slug,
      name,
      universeId: raw.universeId !== undefined && raw.universeId !== null ? Number(raw.universeId) : null,
      rootPlaceId: raw.rootPlaceId ? Number(raw.rootPlaceId) : undefined,
      iconUrl: raw.iconUrl ? String(raw.iconUrl).trim() : '',
      thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl).trim() : '',
      isUniversal: Boolean(raw.isUniversal),
      tabs: cleanTabs,
    };
    game.featuresCount = countGameFeatures(game);
    return game;
  }

  // Fallback 1: match known seed game tabs
  const seedMatch = ROBLOX_GAMES.find((sg) => sg.slug.toLowerCase() === slug);
  if (seedMatch) {
    const game: RobloxGame = {
      slug,
      name: raw.name || seedMatch.name,
      universeId: raw.universeId !== undefined && raw.universeId !== null ? Number(raw.universeId) : seedMatch.universeId,
      rootPlaceId: raw.rootPlaceId ? Number(raw.rootPlaceId) : seedMatch.rootPlaceId,
      iconUrl: raw.iconUrl || seedMatch.iconUrl,
      thumbnailUrl: raw.thumbnailUrl || seedMatch.thumbnailUrl,
      isUniversal: raw.isUniversal !== undefined ? Boolean(raw.isUniversal) : seedMatch.isUniversal,
      tabs: JSON.parse(JSON.stringify(seedMatch.tabs)),
    };
    game.featuresCount = countGameFeatures(game);
    return game;
  }

  // Fallback 2: migrate flat legacy features or description into nested tabs
  let extractedFeatures: string[] = [];
  if (typeof raw.description === 'string' && raw.description.trim()) {
    // Extract phrases from description (e.g. "Scripts include auto-spike, magnet dive...")
    const desc = raw.description.replace(/^.*?include(s)?\s*/i, '').replace(/^.*?feature(s)?\s*/i, '');
    extractedFeatures = desc
      .split(/[,.;]/)
      .map((s: string) => s.replace(/^(and\s+|includes\s+|features\s+)/i, '').trim())
      .filter((s: string) => s.length > 1 && s.length < 50);
  }

  if (extractedFeatures.length === 0) {
    extractedFeatures = ['Main Feature', 'Aimbot', 'ESP', 'Speed Booster'];
  }

  const generatedTabs: GameTab[] = [
    {
      name: 'Legit',
      sections: [
        {
          name: 'Combat',
          features: extractedFeatures.slice(0, 4),
        },
        {
          name: 'Movement',
          features: ['Speed Multiplier', 'Infinite Jump', 'Bunny Hop'],
        },
      ],
    },
    {
      name: 'Visual',
      sections: [
        {
          name: 'ESP',
          features: ['Player Box ESP', 'Tracers', 'Health Display'],
        },
      ],
    },
    {
      name: 'Utility',
      sections: [
        {
          name: 'Automation',
          features: extractedFeatures.slice(4).length > 0 ? extractedFeatures.slice(4) : ['Auto Farm', 'Instant Interact'],
        },
      ],
    },
  ];

  const game: RobloxGame = {
    slug,
    name,
    universeId: raw.universeId !== undefined && raw.universeId !== null ? Number(raw.universeId) : null,
    rootPlaceId: raw.rootPlaceId ? Number(raw.rootPlaceId) : undefined,
    iconUrl: raw.iconUrl ? String(raw.iconUrl).trim() : '',
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl).trim() : '',
    isUniversal: Boolean(raw.isUniversal),
    tabs: generatedTabs,
  };
  game.featuresCount = countGameFeatures(game);
  return game;
}

export function getGameBySlug(slug: string): RobloxGame | undefined {
  const match = ROBLOX_GAMES.find((g) => g.slug.toLowerCase() === slug.toLowerCase());
  return match ? normalizeGame(match) : undefined;
}

export function formatPlayerCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count)) {
    return 'Unavailable';
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toLocaleString();
}
