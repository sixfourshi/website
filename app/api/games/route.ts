import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getGames, upsertGame } from '@/lib/games-server';

export async function GET() {
  const games = await getGames();
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Game name is required.' }, { status: 400 });
    }

    const record = await upsertGame(body);
    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create game.' },
      { status: 500 }
    );
  }
}
