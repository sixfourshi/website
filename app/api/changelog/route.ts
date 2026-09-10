import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import {
  getChangelogReleases,
  upsertChangelogRelease,
  markReleaseAsLatest,
  reorderChangelogReleases,
} from '@/lib/changelog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const releases = await getChangelogReleases();
  return NextResponse.json(releases, {
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
    if (!body.version || typeof body.version !== 'string' || !body.version.trim()) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }
    if (!body.date || typeof body.date !== 'string' || !body.date.trim()) {
      return NextResponse.json({ error: 'Release date is required' }, { status: 400 });
    }
    if (!body.summary || typeof body.summary !== 'string' || !body.summary.trim()) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    const saved = await upsertChangelogRelease(body);

    revalidatePath('/changelog');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    console.error('[API/changelog] Error saving release:', err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to save release.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'mark-latest') {
      if (!body.id) {
        return NextResponse.json({ error: 'Release ID is required' }, { status: 400 });
      }
      const updated = await markReleaseAsLatest(body.id);
      revalidatePath('/changelog');
      revalidatePath('/dashboard');
      return NextResponse.json(updated);
    }

    if (action === 'reorder') {
      if (!Array.isArray(body.orderedIds)) {
        return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 });
      }
      const updated = await reorderChangelogReleases(body.orderedIds);
      revalidatePath('/changelog');
      revalidatePath('/dashboard');
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API/changelog] Error processing update:', err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to process update.' },
      { status: 500 }
    );
  }
}
