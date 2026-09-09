import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('id')?.trim();

  if (!rawId || !/^\d+$/.test(rawId)) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid numeric Place or Universe ID.' },
      { status: 400 }
    );
  }

  const idNum = Number(rawId);

  try {
    let universeId = idNum;
    let rootPlaceId: number | undefined = undefined;

    // First attempt: check if rawId is a Place ID by querying the Roblox places endpoint
    try {
      const placeRes = await fetch(
        `https://apis.roblox.com/universes/v1/places/${rawId}/universe`,
        {
          headers: { Accept: 'application/json', 'User-Agent': 'SourHub/1.0' },
          next: { revalidate: 60 },
        }
      );
      if (placeRes.ok) {
        const placeData = await placeRes.json();
        if (placeData && typeof placeData.universeId === 'number') {
          universeId = placeData.universeId;
          rootPlaceId = idNum;
        }
      }
    } catch {
      // Place lookup failed, fallback to treating rawId as universeId directly
    }

    // Next: query game details using universeId
    const gamesRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'SourHub/1.0' },
        next: { revalidate: 30 },
      }
    );

    let gameData: any = null;
    if (gamesRes.ok) {
      const gJson = await gamesRes.json();
      if (Array.isArray(gJson?.data) && gJson.data.length > 0) {
        gameData = gJson.data[0];
      }
    }

    // If universeId was rawId but game was not found, check if rawId was a place ID that didn't resolve earlier
    if (!gameData && universeId === idNum) {
      try {
        const placeDetailsRes = await fetch(
          `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${rawId}`,
          {
            headers: { Accept: 'application/json', 'User-Agent': 'SourHub/1.0' },
          }
        );
        if (placeDetailsRes.ok) {
          const pdJson = await placeDetailsRes.json();
          if (Array.isArray(pdJson) && pdJson.length > 0 && pdJson[0].universeId) {
            universeId = pdJson[0].universeId;
            rootPlaceId = idNum;

            const secondGamesRes = await fetch(
              `https://games.roblox.com/v1/games?universeIds=${universeId}`
            );
            if (secondGamesRes.ok) {
              const sgJson = await secondGamesRes.json();
              if (Array.isArray(sgJson?.data) && sgJson.data.length > 0) {
                gameData = sgJson.data[0];
              }
            }
          }
        }
      } catch {}
    }

    if (!gameData) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not find any Roblox experience with ID ${rawId}. Verify the Place or Universe ID.`,
        },
        { status: 404 }
      );
    }

    if (!rootPlaceId && typeof gameData.rootPlaceId === 'number') {
      rootPlaceId = gameData.rootPlaceId;
    }

    // Fetch Icon & Thumbnail in parallel
    const [iconRes, thumbRes] = await Promise.allSettled([
      fetch(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`,
        { headers: { Accept: 'application/json', 'User-Agent': 'SourHub/1.0' } }
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png`,
        { headers: { Accept: 'application/json', 'User-Agent': 'SourHub/1.0' } }
      ).then((r) => (r.ok ? r.json() : null)),
    ]);

    let iconUrl = '';
    if (iconRes.status === 'fulfilled' && iconRes.value) {
      const iconItem = iconRes.value.data?.[0];
      if (iconItem?.imageUrl) {
        iconUrl = iconItem.imageUrl;
      }
    }

    let thumbnailUrl = '';
    if (thumbRes.status === 'fulfilled' && thumbRes.value) {
      const thumbItem = thumbRes.value.data?.[0]?.thumbnails?.[0];
      if (thumbItem?.imageUrl) {
        thumbnailUrl = thumbItem.imageUrl;
      }
    }

    return NextResponse.json({
      success: true,
      universeId,
      rootPlaceId: rootPlaceId || null,
      name: gameData.name || '',
      description: gameData.description || '',
      playing: typeof gameData.playing === 'number' ? gameData.playing : null,
      visits: typeof gameData.visits === 'number' ? gameData.visits : null,
      iconUrl,
      thumbnailUrl,
    });
  } catch (err: any) {
    console.error('Failed to lookup Roblox game:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error communicating with Roblox servers' },
      { status: 500 }
    );
  }
}
