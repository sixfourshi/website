import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import {
  deleteGame,
  getGameBySlug,
  upsertGame,
  DeleteGameScriptAction,
  GameValidationError,
} from '@/lib/games-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const game = await getGameBySlug(params.slug);
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json(game, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const record = await upsertGame(body, params.slug);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    revalidatePath(`/scripts/${params.slug}`);
    revalidatePath(`/games/${params.slug}`);
    if (record.slug !== params.slug) {
      revalidatePath(`/scripts/${record.slug}`);
      revalidatePath(`/games/${record.slug}`);
    }

    return NextResponse.json(record);
  } catch (err: any) {
    if (err instanceof GameValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error(`[API/games/${params.slug}] Error updating game:`, err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to update game.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const actionParam = (searchParams.get('action') || 'reassign') as DeleteGameScriptAction;
    const validActions: DeleteGameScriptAction[] = ['keep', 'reassign', 'delete'];
    const scriptAction = validActions.includes(actionParam) ? actionParam : 'reassign';

    const result = await deleteGame(params.slug, scriptAction);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    revalidatePath(`/scripts/${params.slug}`);
    revalidatePath(`/games/${params.slug}`);

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error(`[API/games/${params.slug}] Error deleting game:`, err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete game.' },
      { status: 500 }
    );
  }
}
