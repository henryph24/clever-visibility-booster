import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: brandId } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const connection = await prisma.analyticsConnection.findUnique({
      where: { brandId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No analytics connection found' }, { status: 400 });
    }

    const result = await ga4Service.syncTrafficData(brandId);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to sync analytics data:', error);
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
  }
}
