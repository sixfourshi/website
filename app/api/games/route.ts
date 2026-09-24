import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getGames, upsertGame, deleteGames, GameValidationError } from '@/lib/games-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const games = await getGames();
    return NextResponse.json(games, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[API/games GET] Error retrieving games:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Storage error retrieving games.' },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const record = await upsertGame(body);

    revalidatePath('/');
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
    console.error('[API/games] Error creating game:', err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to create game.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs : [];
    if (slugs.length === 0) {
      return NextResponse.json({ error: 'No game slugs provided for deletion.' }, { status: 400 });
    }

    const deleted = await deleteGames(slugs);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    for (const s of slugs) {
      revalidatePath(`/games/${s}`);
    }

    return NextResponse.json({ ok: true, deletedCount: deleted.length, deletedSlugs: deleted });
  } catch (err: any) {
    console.error('[API/games bulk DELETE] Error:', err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete games.' },
      { status: 500 }
    );
  }
}
