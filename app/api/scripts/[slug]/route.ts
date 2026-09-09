import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { deleteScript, getScript, upsertScript } from '@/lib/scripts';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const script = await getScript(params.slug);
  if (!script) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(script);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const record = await upsertScript(body, params.slug);
  return NextResponse.json(record);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await deleteScript(params.slug);
  return NextResponse.json({ ok: true });
}
