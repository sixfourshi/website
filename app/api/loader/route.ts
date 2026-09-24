import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getStoredLoaderConfig, saveStoredLoaderConfig } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function GET() {
  try {
    const config = await getStoredLoaderConfig({ forceFresh: true });
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
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
    const rawText = await req.text();
    if (!rawText || rawText.length === 0) {
      return NextResponse.json({ error: 'Payload body is required.' }, { status: 400 });
    }

    const body = JSON.parse(rawText);

    if (typeof body.code !== 'string' || body.code.length === 0) {
      return NextResponse.json({ error: 'Loader code is required.' }, { status: 400 });
    }

    const version = typeof body.version === 'string' && body.version.trim().length > 0
      ? body.version.trim()
      : '1.0.0';

    const enabled = body.enabled !== undefined ? Boolean(body.enabled) : true;

    // Use human-friendly date representation matching other entities (e.g. YYYY-MM-DD)
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10);

    const configToSave = {
      code: body.code,
      version,
      enabled,
      updatedAt: formattedDate,
    };

    const saved = await saveStoredLoaderConfig(configToSave);

    revalidatePath('/loader');
    revalidatePath('/raw/loader');
    revalidatePath('/raw');
    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/scripts');

    return NextResponse.json(saved, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
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

export async function POST(req: NextRequest) {
  return PUT(req);
}
