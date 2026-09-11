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
 * Public raw loader endpoint: /raw
 * Serves the active universal loader script source as plain text.
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
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    console.error('[Raw Endpoint] Error retrieving universal loader:', err?.message || err);
    return new NextResponse('-- [Sour Hub] Service temporarily unavailable.\n', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        ...CORS_HEADERS,
      },
    });
  }
}
