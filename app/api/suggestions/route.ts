import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import {
  validateSuggestionInput,
  checkRateLimit,
  submitSuggestion,
  getSuggestionsList,
} from '@/lib/suggestions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

/**
 * Handle CORS preflight requests from Roblox executor CEF environments or external clients.
 */
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
 * Public endpoint to submit a new suggestion.
 * Completely open to in-game Roblox scripts and website visitors.
 * Strictly does NOT require owner/admin authentication.
 * Protected by server-side input validation and rate limiting.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Identify client IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = (forwarded ? forwarded.split(',')[0] : realIp || '127.0.0.1').trim();

    // 2. Check rate limit
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many submissions. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before submitting another suggestion.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds || 60),
            'Cache-Control': 'no-store',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 3. Parse JSON body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400, headers: { 'Cache-Control': 'no-store', ...CORS_HEADERS } }
      );
    }

    // 4. Validate input
    const validation = validateSuggestionInput(body);
    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json(
        { error: validation.error || 'Invalid suggestion input.' },
        { status: 400, headers: { 'Cache-Control': 'no-store', ...CORS_HEADERS } }
      );
    }

    // 5. Save persistently to Vercel Blob storage (or local fallback in dev)
    const saved = await submitSuggestion(validation.sanitized);

    return NextResponse.json(
      {
        success: true,
        message: 'Suggestion submitted successfully!',
        id: saved.id,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    console.error('[Suggestions API] POST error:', msg);
    return NextResponse.json(
      { error: 'Failed to save suggestion to persistent storage. Please try again.' },
      { status: 500, headers: { 'Cache-Control': 'no-store', ...CORS_HEADERS } }
    );
  }
}

/**
 * Protected endpoint to list all suggestions for the Owner Dashboard.
 * Requires valid owner session (returns 401 Unauthorized if not authenticated).
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized. Owner session required.' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          ...CORS_HEADERS,
        },
      }
    );
  }

  try {
    const list = await getSuggestionsList();
    return NextResponse.json(
      { suggestions: list },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { error: msg || 'Failed to retrieve suggestions.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          ...CORS_HEADERS,
        },
      }
    );
  }
}
