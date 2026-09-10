import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getStoredLoaderConfig, saveStoredLoaderConfig } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const config = await getStoredLoaderConfig();
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API/loader GET] Failed fetching loader:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve loader configuration.' },
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

    if (typeof body.code !== 'string' || body.code.trim().length === 0) {
      return NextResponse.json({ error: 'Loader code is required.' }, { status: 400 });
    }

    const version = typeof body.version === 'string' && body.version.trim().length > 0
      ? body.version.trim()
      : '1.0.0';

    const enabled = body.enabled !== undefined ? Boolean(body.enabled) : true;

    // Use human-friendly date representation matching other entities (e.g. YYYY-MM-DD)
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10);

    const updatedConfig = {
      code: body.code,
      version,
      enabled,
      updatedAt: formattedDate,
    };

    await saveStoredLoaderConfig(updatedConfig);

    revalidatePath('/loader');
    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/scripts');

    return NextResponse.json(updatedConfig, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API/loader PUT] Failed updating loader:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save loader to persistent store.' },
      { status: 500 }
    );
  }
}
