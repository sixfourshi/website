import { NextRequest, NextResponse } from 'next/server';
import { getScript } from '@/lib/scripts';
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
 * Public raw endpoint for individual scripts & loaders:
 * e.g., /raw/steal-a-chicken, /raw/blade-ball-vanguard, /raw/loader
 *
 * Returns ONLY raw Lua/Luau script source code as plain text.
 * Strictly no HTML, JSON, layout, markdown, or authentication requirement.
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await props.params;
    const rawSlug = resolvedParams?.slug ? String(resolvedParams.slug).trim() : '';

    if (!rawSlug) {
      return new NextResponse('-- Script not found\n', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          ...CORS_HEADERS,
        },
      });
    }

    // Support main universal loader at /raw/loader
    if (rawSlug === 'loader') {
      const config = await getStoredLoaderConfig({ forceFresh: true });
      const codeToReturn = config.enabled
        ? config.code
        : `-- [Nova Hub] Universal loader is currently disabled.\nwarn("[Nova Hub] The universal loader is currently disabled for maintenance.")\n`;

      return new NextResponse(codeToReturn, {
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

    // Dynamically retrieve the individual script from storage (always fresh)
    const script = await getScript(rawSlug, { forceFresh: true });

    // If a slug does not exist, return a clean 404 response without falling back to another script
    if (!script) {
      return new NextResponse('-- Script not found\n', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          ...CORS_HEADERS,
        },
      });
    }

    // Return pure raw script source code suitable for loadstring(game:HttpGet(...))()
    return new NextResponse(script.code || '', {
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
    console.error(`[Raw Endpoint /raw] Error serving script:`, err?.message || err);
    return new NextResponse('-- [Nova Hub] Error retrieving script.\n', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        ...CORS_HEADERS,
      },
    });
  }
}
