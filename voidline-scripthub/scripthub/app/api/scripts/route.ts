import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getScripts, upsertScript } from '@/lib/scripts';

export async function GET() {
  const scripts = await getScripts();
  return NextResponse.json(scripts);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  const record = await upsertScript(body);
  return NextResponse.json(record, { status: 201 });
}
