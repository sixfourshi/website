import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getScripts, upsertScript, deleteScripts, ScriptValidationError } from '@/lib/scripts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const scripts = await getScripts({ forceFresh: true });
    return NextResponse.json(scripts, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('[API/scripts GET] Error retrieving scripts:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Storage error retrieving scripts.' },
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
    const record = await upsertScript(body);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    revalidatePath(`/scripts/${record.slug}`);

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    if (err instanceof ScriptValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API/scripts] Error creating script:', err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to create script.' },
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
      return NextResponse.json({ error: 'No script slugs provided for deletion.' }, { status: 400 });
    }

    const deleted = await deleteScripts(slugs);

    revalidatePath('/');
    revalidatePath('/scripts');
    revalidatePath('/games');
    revalidatePath('/dashboard');
    for (const s of slugs) {
      revalidatePath(`/scripts/${s}`);
      revalidatePath(`/raw/${s}`);
    }

    return NextResponse.json({ ok: true, deletedCount: deleted.length, deletedSlugs: deleted });
  } catch (err: any) {
    console.error('[API/scripts bulk DELETE] Error:', err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete scripts.' },
      { status: 500 }
    );
  }
}
