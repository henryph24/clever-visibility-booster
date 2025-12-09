import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: brandId } = await params;
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);

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
      return NextResponse.json(
        { error: 'No analytics connection found', connected: false },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get traffic data by source
    const trafficBySource = await prisma.aITrafficData.groupBy({
      by: ['source'],
      where: {
        brandId,
        date: { gte: startDate },
      },
      _sum: {
        sessions: true,
        users: true,
        engagedSessions: true,
        conversions: true,
        revenue: true,
      },
    });

    // Get traffic data by date for trends
    const trafficByDate = await prisma.aITrafficData.groupBy({
      by: ['date'],
      where: {
        brandId,
        date: { gte: startDate },
      },
      _sum: {
        sessions: true,
        users: true,
        conversions: true,
        revenue: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get totals
    const totals = await prisma.aITrafficData.aggregate({
      where: {
        brandId,
        date: { gte: startDate },
      },
      _sum: {
        sessions: true,
        users: true,
        engagedSessions: true,
        conversions: true,
        revenue: true,
      },
      _avg: {
        bounceRate: true,
        avgSessionDuration: true,
      },
    });

    // Format source data with friendly names
    const sourceNameMap: Record<string, string> = {
      'chat.openai.com': 'ChatGPT',
      'chatgpt.com': 'ChatGPT',
      'claude.ai': 'Claude',
      'perplexity.ai': 'Perplexity',
      'gemini.google.com': 'Gemini',
      'bard.google.com': 'Google Bard',
      'copilot.microsoft.com': 'Microsoft Copilot',
      'bing.com/chat': 'Bing Chat',
      'you.com': 'You.com',
      'poe.com': 'Poe',
      'phind.com': 'Phind',
      'character.ai': 'Character.AI',
    };

    const bySource = trafficBySource.map((item) => ({
      source: item.source,
      displayName: sourceNameMap[item.source] || item.source,
      sessions: item._sum.sessions || 0,
      users: item._sum.users || 0,
      engagedSessions: item._sum.engagedSessions || 0,
      conversions: item._sum.conversions || 0,
      revenue: item._sum.revenue || 0,
      engagementRate: item._sum.sessions
        ? ((item._sum.engagedSessions || 0) / item._sum.sessions) * 100
        : 0,
      conversionRate: item._sum.sessions
        ? ((item._sum.conversions || 0) / item._sum.sessions) * 100
        : 0,
    }));

    const trends = trafficByDate.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      sessions: item._sum.sessions || 0,
      users: item._sum.users || 0,
      conversions: item._sum.conversions || 0,
      revenue: item._sum.revenue || 0,
    }));

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        days,
      },
      totals: {
        sessions: totals._sum.sessions || 0,
        users: totals._sum.users || 0,
        engagedSessions: totals._sum.engagedSessions || 0,
        conversions: totals._sum.conversions || 0,
        revenue: totals._sum.revenue || 0,
        avgBounceRate: totals._avg.bounceRate,
        avgSessionDuration: totals._avg.avgSessionDuration,
      },
      bySource,
      trends,
      lastSyncAt: connection.lastSyncAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch traffic data:', error);
    return NextResponse.json({ error: 'Failed to fetch traffic data' }, { status: 500 });
  }
}
