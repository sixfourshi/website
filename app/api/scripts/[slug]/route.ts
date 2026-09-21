import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { deleteScript, getScript, upsertScript, ScriptValidationError } from '@/lib/scripts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const script = await getScript(params.slug);
    if (!script) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(script, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error(`[API/scripts/${params.slug} GET] Error:`, err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Storage error retrieving script.' },
      { status: 503 }
    );
  }
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
    const record = await upsertScript(body, params.slug);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    revalidatePath(`/scripts/${params.slug}`);
    if (record.slug !== params.slug) {
      revalidatePath(`/scripts/${record.slug}`);
    }

    return NextResponse.json(record);
  } catch (err: any) {
    if (err instanceof ScriptValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error(`[API/scripts/${params.slug}] Error updating script:`, err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to update script.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteScript(params.slug);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    revalidatePath(`/scripts/${params.slug}`);

    return NextResponse.json(
      { ok: true, deletedSlug: params.slug },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error(`[API/scripts/${params.slug}] Error deleting script:`, err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete script.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}
