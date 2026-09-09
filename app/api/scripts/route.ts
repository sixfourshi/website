import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getScripts, upsertScript, ScriptValidationError } from '@/lib/scripts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const scripts = await getScripts();
  return NextResponse.json(scripts, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
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
