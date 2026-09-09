import { NextRequest, NextResponse } from 'next/server';
import { getScript } from '@/lib/scripts';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const script = await getScript(params.slug);

  if (!script) {
    return new NextResponse('-- Script not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new NextResponse(script.code, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
