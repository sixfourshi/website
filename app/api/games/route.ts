import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getGames, upsertGame, GameValidationError } from '@/lib/games-server';

export const dynamic = 'force-dynamic';

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
    const record = await upsertGame(body);

    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    revalidatePath(`/scripts/${record.slug}`);
    revalidatePath(`/games/${record.slug}`);

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    if (err instanceof GameValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err.message || 'Failed to create game.' },
      { status: 500 }
    );
  }
}
