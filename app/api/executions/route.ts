import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import {
  getStoredExecutions,
  recordExecution,
  clearOldExecutionLogs,
  computeAnalytics,
  checkRateLimit,
  type ExecutionLog,
} from '@/lib/executions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/executions
 * - Public users: Returns informational status explaining the telemetry endpoint is active.
 * - Authenticated owners: Returns complete execution analytics & paginated logs with filtering.
 */
export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();

  // Public informational response
  if (!authed) {
    return NextResponse.json(
      {
        status: 'active',
        service: 'Sour Hub Telemetry',
        endpoint: '/api/executions',
        message: 'Execution tracking endpoint is operational. Telemetry events are accepted via POST.',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // Authenticated owner response
  try {
    const store = await getStoredExecutions();
    const analytics = computeAnalytics(store);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const gameFilter = searchParams.get('game')?.trim().toLowerCase() || 'all';
    const statusFilter = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const dateFilter = searchParams.get('dateFilter')?.trim().toLowerCase() || 'all';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    let filtered: ExecutionLog[] = store.recentLogs;

    // Filter by game
    if (gameFilter && gameFilter !== 'all') {
      filtered = filtered.filter((l) => l.gameName.toLowerCase() === gameFilter);
    }

    // Filter by status (supported / unknown)
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    // Filter by date range
    if (dateFilter && dateFilter !== 'all') {
      const now = Date.now();
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        filtered = filtered.filter((l) => l.timestamp.startsWith(todayStr));
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((l) => new Date(l.timestamp).getTime() >= sevenDaysAgo);
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((l) => new Date(l.timestamp).getTime() >= thirtyDaysAgo);
      }
    }

    // Keyword search across game, place ID, universe ID, or session ID
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.gameName.toLowerCase().includes(search) ||
          String(l.placeId).includes(search) ||
          String(l.universeId).includes(search) ||
          l.sessionId.toLowerCase().includes(search)
      );
    }

    const totalLogs = filtered.length;
    const totalPages = Math.ceil(totalLogs / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json(
      {
        status: 'active',
        authenticated: true,
        analytics,
        logs: paginatedLogs,
        pagination: {
          page,
          limit,
          totalLogs,
          totalPages,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('[API /api/executions GET] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to retrieve execution analytics.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/executions
 * Public execution telemetry event from Roblox executors.
 * Strictly anonymous: does NOT collect usernames, user IDs, or IPs in logs.
 */
export async function POST(req: NextRequest) {
  // Reject oversized payloads (> 4KB)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 4096) {
    return NextResponse.json(
      { error: 'Payload too large.' },
      { status: 413 }
    );
  }

  // Extract client IP solely for rate limiting (never stored or logged)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before submitting telemetry.' },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Request body must be a JSON object.' },
      { status: 400 }
    );
  }

  const { placeId, universeId, sessionId } = body;

  // Validate placeId
  const parsedPlaceId = Number(placeId);
  if (isNaN(parsedPlaceId) || parsedPlaceId <= 0 || !Number.isFinite(parsedPlaceId)) {
    return NextResponse.json(
      { error: 'Invalid or missing placeId. Must be a positive integer.' },
      { status: 400 }
    );
  }

  // Validate universeId
  const parsedUniverseId = Number(universeId);
  if (isNaN(parsedUniverseId) || parsedUniverseId < 0 || !Number.isFinite(parsedUniverseId)) {
    return NextResponse.json(
      { error: 'Invalid or missing universeId.' },
      { status: 400 }
    );
  }

  // Validate sessionId
  if (
    typeof sessionId !== 'string' ||
    sessionId.trim().length === 0 ||
    sessionId.length > 128
  ) {
    return NextResponse.json(
      { error: 'Invalid sessionId. Must be a non-empty string under 128 characters.' },
      { status: 400 }
    );
  }

  try {
    const result = await recordExecution({
      placeId: Math.floor(parsedPlaceId),
      universeId: Math.floor(parsedUniverseId),
      sessionId: sessionId.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('[API /api/executions POST] Error recording execution:', err?.message || err);
    return NextResponse.json(
      { error: 'Internal server error recording execution event.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/executions
 * Owner-only action to clear old execution logs.
 * Preserves cumulative counts and game analytics.
 */
export async function DELETE(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json(
      { error: 'Unauthorized. Owner session required.' },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const clearType = body?.clearType;
  if (!['all', 'older_7_days', 'older_30_days'].includes(clearType)) {
    return NextResponse.json(
      { error: 'Invalid clearType. Must be all, older_7_days, or older_30_days.' },
      { status: 400 }
    );
  }

  try {
    const result = await clearOldExecutionLogs(clearType);
    return NextResponse.json(
      {
        success: true,
        message: `Successfully cleared ${result.clearedCount} detailed execution logs. Cumulative analytics remain preserved.`,
        clearedCount: result.clearedCount,
        remainingCount: result.remainingCount,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API /api/executions DELETE] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to clear execution logs.' },
      { status: 500 }
    );
  }
}
