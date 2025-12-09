import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; competitorId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, competitorId } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const competitor = await prisma.competitor.findFirst({
      where: { id: competitorId, brandId: id },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    await prisma.competitor.delete({ where: { id: competitorId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to delete competitor:', error);
    return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
  }
}
