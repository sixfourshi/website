import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import {
  updateSuggestionStatus,
  deleteSuggestion,
  type SuggestionStatus,
} from '@/lib/suggestions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_STATUSES: SuggestionStatus[] = [
  'pending',
  'reviewed',
  'planned',
  'added',
  'rejected',
];

/**
 * Update the status of a suggestion (Owner only).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized. Owner session required.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const body = await req.json();
    const status = body.status as SuggestionStatus;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const updated = await updateSuggestionStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: 'Suggestion not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: true, suggestion: updated },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { error: msg || 'Failed to update suggestion status.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

/**
 * Permanently delete a suggestion (Owner only).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized. Owner session required.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const success = await deleteSuggestion(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Suggestion not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Suggestion permanently deleted.' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { error: msg || 'Failed to delete suggestion.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
