import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import {
  deleteGame,
  getGameBySlug,
  upsertGame,
  DeleteGameScriptAction,
} from '@/lib/games-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const game = await getGameBySlug(params.slug);
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json(game);
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
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Game name is required.' }, { status: 400 });
    }

    const record = await upsertGame(body, params.slug);
    return NextResponse.json(record);
  } catch (err: any) {
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
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete game.' },
      { status: 500 }
    );
  }
}
