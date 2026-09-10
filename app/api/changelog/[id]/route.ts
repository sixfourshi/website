import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { deleteChangelogRelease } from '@/lib/changelog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await deleteChangelogRelease(id);

    revalidatePath('/changelog');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error(`[API/changelog] Error deleting release:`, err?.message || err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete release.' },
      { status: 500 }
    );
  }
}
