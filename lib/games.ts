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

export const ROBLOX_GAMES: RobloxGame[] = [
  {
    slug: 'volleyball-legends',
    name: 'Volleyball Legends',
    universeId: 6931042565,
    rootPlaceId: 73956553001240,
    iconUrl: 'https://tr.rbxcdn.com/180DAY-ed1f3412683078b25ba13dc18524c5d2/150/150/Image/Png/noFilter',
    thumbnailUrl: 'https://tr.rbxcdn.com/180DAY-a7e54c63071c2e78e469b19e15f67b51/768/432/Image/Png/noFilter',
    tabs: [
      {
        name: 'Legit',
        sections: [
          {
            name: 'Assistance',
            features: ['Auto Spike', 'Magnet Dive', 'Curve Serve', 'Stamina Lock', 'Perfect Timing'],
          },
          {
            name: 'Court ESP',
            features: ['Ball Trajectory ESP', 'Landing Zone Marker', 'Jump Indicator'],
          },
        ],
      },
      {
        name: 'Rage',
        sections: [
          {
            name: 'Auto Play',
            features: ['Auto Receive', 'Instant Set', 'Super Spike', 'Fast Run', 'Super Jump', 'Instant Win'],
          },
        ],
      },
      {
        name: 'Visual',
        sections: [
          {
            name: 'Player ESP',
            features: ['Player Boxes', 'Stamina Bar', 'Score Overlay', 'Tracer Lines'],
          },
          {
            name: 'World',
            features: ['Fullbright', 'Remove Shadows'],
          },
        ],
      },
      {
        name: 'Cosmetics',
        sections: [
          {
            name: 'Customs',
            features: ['Ball Trail', 'Spike Aura', 'Custom Animations', 'Net Glow'],
          },
        ],
      },
    ],
  },
  {
    slug: 'rivals',
    name: 'Rivals',
    universeId: 6035872082,
    rootPlaceId: 17625359962,
    iconUrl: 'https://tr.rbxcdn.com/180DAY-2f7bb0535e48ac3766835b44ded27a74/150/150/Image/Png/noFilter',
    thumbnailUrl: 'https://tr.rbxcdn.com/180DAY-fb02f48458ff689309df8d52bf516d04/768/432/Image/Png/noFilter',
    tabs: [
      {
        name: 'Legit',
        sections: [
          {
            name: 'Silent Aim',
            features: [
              'Silent Aim',
              'FOV',
              'Miss Chance',
              'Target Part',
              'FOV Circle',
              'Velocity Prediction',
              'Prediction Strength',
            ],
          },
          {
            name: 'Aimbot',
            features: ['Aimbot', 'Hold Key', 'FOV', 'Smoothing'],
          },
          {
            name: 'Movement',
            features: ['Bunny Hop'],
          },
        ],
      },
      {
        name: 'Rage',
        sections: [
          {
            name: 'Combat',
            features: ['Rapid Fire', 'Wallbang', 'Instant Hit', 'Kill Aura', 'Auto Reload'],
          },
          {
            name: 'Exploits',
            features: ['Speed Multiplier', 'Infinite Jump', 'No Recoil', 'No Spread'],
          },
        ],
      },
      {
        name: 'Visual',
        sections: [
          {
            name: 'ESP',
            features: [
              'Box ESP',
              'Chams',
              'Name ESP',
              'Health Bar',
              'Weapon Display',
              'Snaplines',
              'Distance Tracker',
            ],
          },
          {
            name: 'World',
            features: ['Fullbright', 'No Fog', 'Custom Crosshair'],
          },
        ],
      },
      {
        name: 'Cosmetics',
        sections: [
          {
            name: 'Skins',
            features: ['Unlock All Wraps', 'Custom Kill Effects', 'Weapon Glow', 'Custom Tracers'],
          },
        ],
      },
    ],
  },
  {
    slug: 'gakuran',
    name: 'Gakuran',
    universeId: 9199655655,
    rootPlaceId: 128736949265057,
    iconUrl: 'https://tr.rbxcdn.com/180DAY-a599e83f751f97ee7eb191a1d9fa8ec7/150/150/Image/Png/noFilter',
    thumbnailUrl: 'https://tr.rbxcdn.com/180DAY-f88dff1c6297298d0f8553ac1e61cb98/768/432/Image/Png/noFilter',
    tabs: [
      {
        name: 'Legit',
        sections: [
          {
            name: 'Combat Assist',
            features: ['Auto-Combo Chaining', 'Instant Block/Parry', 'Hitbox Expander', 'Dodge Predictor', 'Counter Assist'],
          },
          {
            name: 'Farming',
            features: ['Yen Autofarm', 'Trait Reroll Assistant', 'Quest Auto-Claim'],
          },
        ],
      },
      {
        name: 'Rage',
        sections: [
          {
            name: 'God Mode',
            features: ['Kill Aura', 'Instant Stun', 'Infinite Stamina', 'Speed Hack', 'One Hit Kill'],
          },
        ],
      },
      {
        name: 'Visual',
        sections: [
          {
            name: 'Overlays',
            features: ['Mob ESP', 'Item ESP', 'Boss Spawn Timer', 'Player Radar', 'Name Tags'],
          },
        ],
      },
      {
        name: 'Cosmetics',
        sections: [
          {
            name: 'Visuals',
            features: ['Uniform Glow', 'Custom Aura', 'Weapon Trail', 'Custom Sound FX'],
          },
        ],
      },
    ],
  },
  {
    slug: 'redliner',
    name: 'REDLINER',
    universeId: 7265339759,
    rootPlaceId: 94987506187454,
    iconUrl: 'https://tr.rbxcdn.com/180DAY-584d516c4cf3f16f37a8efa4e86e9dfe/150/150/Image/Png/noFilter',
    thumbnailUrl: 'https://tr.rbxcdn.com/180DAY-4d79ac2197e817aed44b8babddd84637/768/432/Image/Png/noFilter',
    tabs: [
      {
        name: 'Legit',
        sections: [
          {
            name: 'Movement',
            features: ['Slide Booster', 'Bunny Hop', 'Speed Uncapper', 'Air Strafe', 'Momentum Lock'],
          },
          {
            name: 'Blade Assist',
            features: ['Auto-Parry', 'Deflect Window Helper', 'Attack Range Extension'],
          },
        ],
      },
      {
        name: 'Rage',
        sections: [
          {
            name: 'Combat',
            features: ['Instant Kill', 'Rapid Slash', 'Wall Phase', 'No Cooldowns', 'Infinite Dash'],
          },
        ],
      },
      {
        name: 'Visual',
        sections: [
          {
            name: 'Sensory',
            features: ['Enemy Glow', 'Bullet Tracers', 'Motion Blur Override', 'Parry Indicator'],
          },
        ],
      },
      {
        name: 'Cosmetics',
        sections: [
          {
            name: 'Customs',
            features: ['Katana Trail', 'Custom Slash Color', 'Kill FX', 'Weapon Shimmer'],
          },
        ],
      },
    ],
  },
  {
    slug: 'blade-ball',
    name: 'Blade Ball',
    universeId: 4777817887,
    rootPlaceId: 13772394625,
    iconUrl: 'https://tr.rbxcdn.com/180DAY-b7317d44fd85c141d154cede4aacf4b0/150/150/Image/Png/noFilter',
    thumbnailUrl: 'https://tr.rbxcdn.com/180DAY-be150ba07c74cd57deb31791c2675323/768/432/Image/Png/noFilter',
    tabs: [
      {
        name: 'Legit',
        sections: [
          {
            name: 'Auto Deflect',
            features: [
              'Predictive Auto-Deflect',
              'Curve Ball Counter',
              'Manual Spam Trigger',
              'Ping Compensation',
              'Distance Threshold',
            ],
          },
          {
            name: 'Movement',
            features: ['Speed Boost', 'Auto Jump', 'Safe Position Marker'],
          },
        ],
      },
      {
        name: 'Rage',
        sections: [
          {
            name: 'Exploits',
            features: ['Infinite Slash Range', 'Instant Clashing Win', 'Auto Target Next', 'Teleport to Safety', 'Spam Deflect'],
          },
        ],
      },
      {
        name: 'Visual',
        sections: [
          {
            name: 'Visualizer',
            features: ['Ball Trajectory 3D', 'Distance Circle', 'Target Line', 'Player Danger ESP'],
          },
        ],
      },
      {
        name: 'Cosmetics',
        sections: [
          {
            name: 'Unlocks',
            features: ['Sword FX', 'Custom Explosion', 'Trail Visualizer', 'Aura Skin'],
          },
        ],
      },
    ],
  },
  {
    slug: 'universal',
    name: 'Universal Scripts',
    universeId: 28220420,
    rootPlaceId: 95206881,
    isUniversal: true,
    iconUrl: 'https://tr.rbxcdn.com/180DAY-0023459e3957978e242c1d270dafbae2/150/150/Image/Png/noFilter',
    thumbnailUrl: 'https://tr.rbxcdn.com/180DAY-1d29750b06e247dc4ad9dbf2b4aaa10e/768/432/Image/Png/noFilter',
    tabs: [
      {
        name: 'Legit',
        sections: [
          {
            name: 'Movement',
            features: ['Fly', 'Infinite Jump', 'Speed Multiplier', 'No Clip', 'Anti-Fall Damage'],
          },
          {
            name: 'Character',
            features: ['God Mode', 'Invisible', 'Btools', 'Teleport to Player'],
          },
        ],
      },
      {
        name: 'Rage',
        sections: [
          {
            name: 'Universal Combat',
            features: ['Click Teleport', 'Fling Player', 'Orbit Target', 'Mass Kill', 'Chat Spam'],
          },
        ],
      },
      {
        name: 'Visual',
        sections: [
          {
            name: 'ESP Suite',
            features: ['Universal Box ESP', 'Skeleton ESP', 'Name Tags', 'Health Display', 'Tracers', 'Lumen ESP'],
          },
          {
            name: 'Environment',
            features: ['Fullbright', 'Remove Fog', 'X-Ray', 'Custom Skybox'],
          },
        ],
      },
      {
        name: 'Cosmetics',
        sections: [
          {
            name: 'Extras',
            features: ['HaloUI Theme', 'Custom Crosshair', 'FPS Uncap', 'Nightfall Macro'],
          },
        ],
      },
    ],
  },
];

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
