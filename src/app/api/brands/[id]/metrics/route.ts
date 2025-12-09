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

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get latest metrics
    const latestMetric = await prisma.visibilityMetric.findFirst({
      where: { brandId: id },
      orderBy: { date: 'desc' },
    });

    // Get total prompts count
    const promptCount = await prisma.prompt.count({
      where: { topic: { brandId: id } },
    });

    // Get brand mention statistics
    const mentions = await prisma.brandMention.findMany({
      where: { brandId: id },
      include: { response: true },
    });

    const totalResponses = await prisma.lLMResponse.count({
      where: { prompt: { topic: { brandId: id } } },
    });

    const mentionCount = mentions.length;
    const visibilityPct = totalResponses > 0 ? (mentionCount / totalResponses) * 100 : 0;
    const rankedMentions = mentions.filter((m) => m.rankPosition !== null);
    const avgRank =
      rankedMentions.length > 0
        ? rankedMentions.reduce((sum, m) => sum + (m.rankPosition || 0), 0) / rankedMentions.length
        : null;
    const citationCount = mentions.filter((m) => m.isCited).length;

    return NextResponse.json({
      visibilityPct: latestMetric?.visibilityPct || visibilityPct,
      avgRank: latestMetric?.avgRank || avgRank,
      citationCount: latestMetric?.citationCount || citationCount,
      promptCount,
      totalResponses,
      mentionCount,
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
