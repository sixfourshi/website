import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 30; // cache for 30s

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universeIdsParam = searchParams.get('universeIds');

  if (!universeIdsParam) {
    return NextResponse.json(
      { success: false, error: 'universeIds parameter is required' },
      { status: 400 }
    );
  }

  // Validate universeIds are numeric comma-separated
  const ids = universeIdsParam
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));

  if (ids.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid universeIds provided' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${ids.join(',')}`,
      {
        signal: controller.signal,
        next: { revalidate: 30 },
        headers: {
          Accept: 'application/json',
          'User-Agent': 'NovaHub/1.0',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Roblox API returned status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result: Record<string, { playing: number | null; visits: number | null; name: string }> = {};

    if (Array.isArray(data?.data)) {
      for (const item of data.data) {
        result[String(item.id)] = {
          playing: typeof item.playing === 'number' ? item.playing : null,
          visits: typeof item.visits === 'number' ? item.visits : null,
          name: item.name || '',
        };
      }
    }

    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('Failed to fetch from Roblox API:', err);
    return NextResponse.json(
      { success: false, error: 'Request to Roblox API timed out or failed' },
      { status: 504 }
    );
  }
}
