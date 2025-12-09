import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      select: {
        provider: true,
        propertyId: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    if (!connection) {
      return NextResponse.json({
        connected: false,
        provider: null,
        propertyId: null,
        lastSyncAt: null,
      });
    }

    // Get summary of AI traffic data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trafficSummary = await prisma.aITrafficData.aggregate({
      where: {
        brandId,
        date: { gte: thirtyDaysAgo },
      },
      _sum: {
        sessions: true,
        users: true,
        conversions: true,
        revenue: true,
      },
    });

    return NextResponse.json({
      connected: true,
      provider: connection.provider,
      propertyId: connection.propertyId,
      lastSyncAt: connection.lastSyncAt,
      connectedAt: connection.createdAt,
      summary: {
        totalSessions: trafficSummary._sum.sessions || 0,
        totalUsers: trafficSummary._sum.users || 0,
        totalConversions: trafficSummary._sum.conversions || 0,
        totalRevenue: trafficSummary._sum.revenue || 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch analytics status:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics status' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: brandId } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    await prisma.analyticsConnection.deleteMany({
      where: { brandId },
    });

    // Optionally delete historical data
    await prisma.aITrafficData.deleteMany({
      where: { brandId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to disconnect analytics:', error);
    return NextResponse.json({ error: 'Failed to disconnect analytics' }, { status: 500 });
  }
}
