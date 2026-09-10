import { NextRequest, NextResponse } from 'next/server';
import { getStoredLoaderConfig } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Public raw loader endpoint: https://sourhub.vercel.app/loader
 * Returns pure Luau plain-text code for Roblox executors.
 * Strictly no HTML, markdown, or webpage wrapper.
 */
export async function GET(_req: NextRequest) {
  try {
    const config = await getStoredLoaderConfig();

    if (!config.enabled) {
      const disabledMessage = `-- [Sour Hub] Universal loader is currently disabled.\nwarn("[Sour Hub] The universal loader is currently disabled for maintenance.")\n`;
      return new NextResponse(disabledMessage, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    return new NextResponse(config.code, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('[Loader Endpoint] Error retrieving universal loader:', err?.message || err);
    const errorMessage = `-- [Sour Hub] Service temporarily unavailable.\nwarn("[Sour Hub] Could not load universal loader.")\n`;
    return new NextResponse(errorMessage, {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  }
}
