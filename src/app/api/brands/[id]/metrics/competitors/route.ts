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
      include: { competitors: true },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get total responses for this brand's prompts
    const totalResponses = await prisma.lLMResponse.count({
      where: { prompt: { topic: { brandId: id } } },
    });

    // Get brand mentions
    const brandMentions = await prisma.brandMention.count({
      where: { brandId: id },
    });

    // Get competitor mentions
    const competitorData = await Promise.all(
      brand.competitors.map(async (competitor) => {
        const mentions = await prisma.brandMention.count({
          where: { competitorId: competitor.id },
        });
        return {
          name: competitor.name,
          mentions,
          visibilityPct: totalResponses > 0 ? Math.round((mentions / totalResponses) * 100) : 0,
        };
      })
    );

    // Add your brand to comparison
    const result = [
      {
        name: brand.name,
        mentions: brandMentions,
        visibilityPct: totalResponses > 0 ? Math.round((brandMentions / totalResponses) * 100) : 0,
        isYourBrand: true,
      },
      ...competitorData.map((c) => ({ ...c, isYourBrand: false })),
    ].sort((a, b) => b.mentions - a.mentions);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch competitor metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor metrics' }, { status: 500 });
  }
}
