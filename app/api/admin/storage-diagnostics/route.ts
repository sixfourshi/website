import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { runStorageDiagnostics } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign into the owner dashboard first.' },
      { status: 401 }
    );
  }

  try {
    const report = await runStorageDiagnostics();
    return NextResponse.json(report, {
      status: report.overallSuccess ? 200 : 502,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[API/storage-diagnostics] Diagnostics failed with exception:', err?.message || err);
    return NextResponse.json(
      {
        error: err?.message || 'Storage diagnostics failed.',
        statusCode: err?.statusCode || 500,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
