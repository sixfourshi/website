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
  try {
    const releases = await getChangelogReleases({ forceFresh: true });
    return NextResponse.json(releases, {
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[API/changelog] Error fetching releases:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Storage error retrieving changelog releases.' },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const version = (body.version ?? body.currentVersion ?? body.ver ?? '').toString().trim();
    const date = (body.date ?? body.publishedDate ?? body.published_date ?? body.releaseDate ?? '').toString().trim();
    const summary = (body.summary ?? '').toString().trim();

    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'Release date is required' }, { status: 400 });
    }
    if (!summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    const saved = await upsertChangelogRelease({
      ...body,
      version,
      date,
      publishedDate: date,
      releaseDate: date,
      currentVersion: version,
      summary,
    });

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
      revalidatePath('/');
      return NextResponse.json(updated);
    }

    if (action === 'reorder') {
      if (!Array.isArray(body.orderedIds)) {
        return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 });
      }
      const updated = await reorderChangelogReleases(body.orderedIds);
      revalidatePath('/changelog');
      revalidatePath('/dashboard');
      revalidatePath('/');
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
