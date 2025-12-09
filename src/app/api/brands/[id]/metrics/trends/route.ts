import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
      include: { competitors: true },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get visibility metrics over time
    const metrics = await prisma.visibilityMetric.findMany({
      where: {
        brandId: id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // If no stored metrics, generate from responses
    if (metrics.length === 0) {
      const responses = await prisma.lLMResponse.findMany({
        where: {
          prompt: { topic: { brandId: id } },
          createdAt: { gte: startDate },
        },
        include: { mentions: true },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const byDate = new Map<string, { total: number; mentioned: number }>();
      for (const response of responses) {
        const dateKey = response.createdAt.toISOString().split('T')[0];
        const current = byDate.get(dateKey) || { total: 0, mentioned: 0 };
        current.total++;
        if (response.mentions.some((m) => m.brandId === id)) {
          current.mentioned++;
        }
        byDate.set(dateKey, current);
      }

      const trends = Array.from(byDate.entries()).map(([date, data]) => ({
        date,
        visibility: data.total > 0 ? Math.round((data.mentioned / data.total) * 100) : 0,
      }));

      return NextResponse.json(trends);
    }

    const trends = metrics.map((m) => ({
      date: m.date.toISOString().split('T')[0],
      visibility: m.visibilityPct,
    }));

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
