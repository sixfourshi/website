import { NextRequest, NextResponse } from 'next/server';
import { getStoredLoaderConfig } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Public raw loader endpoint: https://novaxhub.vercel.app/loader
 * Returns pure Luau plain-text code for Roblox executors and browsers.
 * Strictly no HTML, markdown, or webpage wrapper.
 */
export async function GET(_req: NextRequest) {
  try {
    const config = await getStoredLoaderConfig({ forceFresh: true });

    if (!config.enabled) {
      const disabledMessage = `-- [Nova Hub] Universal loader is currently disabled.\nwarn("[Nova Hub] The universal loader is currently disabled for maintenance.")\n`;
      return new NextResponse(disabledMessage, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          ...CORS_HEADERS,
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
        'Surrogate-Control': 'no-store',
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    console.error('[Loader Endpoint] Error retrieving universal loader:', err?.message || err);
    const errorMessage = `-- [Nova Hub] Service temporarily unavailable.\nwarn("[Nova Hub] Could not load universal loader.")\n`;
    return new NextResponse(errorMessage, {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        ...CORS_HEADERS,
      },
    });
  }
}
