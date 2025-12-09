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

    // Find sources that mention competitors but not the brand
    const sources = await prisma.citedSource.findMany({
      where: {
        response: { prompt: { topic: { brandId: id } } },
      },
      include: {
        response: {
          include: {
            mentions: true,
            prompt: true,
          },
        },
      },
    });

    const gaps = sources
      .filter((source) => {
        const mentions = source.response.mentions;
        const hasBrandMention = mentions.some((m) => m.brandId === id);
        const hasCompetitorMention = mentions.some((m) => m.competitorId !== null);
        return !hasBrandMention && hasCompetitorMention;
      })
      .map((source) => {
        const competitorMentions = source.response.mentions
          .filter((m) => m.competitorId !== null)
          .map((m) => m.brandName);

        return {
          domain: source.domain,
          url: source.url,
          title: source.title,
          mentionedCompetitors: Array.from(new Set(competitorMentions)),
          prompt: source.response.prompt.text,
        };
      });

    // Remove duplicates by URL
    const uniqueGaps = Array.from(new Map(gaps.map((g) => [g.url, g])).values());

    return NextResponse.json(uniqueGaps);
  } catch (error) {
    console.error('Failed to fetch content gaps:', error);
    return NextResponse.json({ error: 'Failed to fetch content gaps' }, { status: 500 });
  }
}
