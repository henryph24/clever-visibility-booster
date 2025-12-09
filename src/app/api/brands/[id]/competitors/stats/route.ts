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

    // Get total responses
    const totalResponses = await prisma.lLMResponse.count({
      where: { prompt: { topic: { brandId: id } } },
    });

    // Get brand statistics
    const brandMentions = await prisma.brandMention.findMany({
      where: { brandId: id },
    });

    const brandStats = {
      name: brand.name,
      domain: brand.domain,
      mentionCount: brandMentions.length,
      visibilityPct:
        totalResponses > 0 ? Math.round((brandMentions.length / totalResponses) * 100) : 0,
      avgRank: calculateAvgRank(brandMentions),
      isYourBrand: true,
    };

    // Get competitor statistics
    const competitorStats = await Promise.all(
      brand.competitors.map(async (competitor) => {
        const mentions = await prisma.brandMention.findMany({
          where: { competitorId: competitor.id },
        });

        // Calculate wins/losses against your brand
        const promptsWithBoth = await prisma.prompt.findMany({
          where: { topic: { brandId: id } },
          include: {
            responses: {
              include: {
                mentions: {
                  where: {
                    OR: [{ brandId: id }, { competitorId: competitor.id }],
                  },
                },
              },
            },
          },
        });

        let wins = 0;
        let losses = 0;

        promptsWithBoth.forEach((prompt) => {
          prompt.responses.forEach((response) => {
            const yourMention = response.mentions.find((m) => m.brandId === id);
            const theirMention = response.mentions.find((m) => m.competitorId === competitor.id);

            if (yourMention && theirMention) {
              const yourRank = yourMention.rankPosition || 999;
              const theirRank = theirMention.rankPosition || 999;
              if (yourRank < theirRank) losses++;
              else if (theirRank < yourRank) wins++;
            } else if (theirMention && !yourMention) {
              wins++;
            } else if (yourMention && !theirMention) {
              losses++;
            }
          });
        });

        return {
          id: competitor.id,
          name: competitor.name,
          domain: competitor.domain,
          mentionCount: mentions.length,
          visibilityPct:
            totalResponses > 0 ? Math.round((mentions.length / totalResponses) * 100) : 0,
          avgRank: calculateAvgRank(mentions),
          wins,
          losses,
          isYourBrand: false,
        };
      })
    );

    return NextResponse.json({ brand: brandStats, competitors: competitorStats, totalResponses });
  } catch (error) {
    console.error('Failed to fetch competitor stats:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor stats' }, { status: 500 });
  }
}

function calculateAvgRank(mentions: { rankPosition: number | null }[]): number | null {
  const ranked = mentions.filter((m) => m.rankPosition !== null);
  if (ranked.length === 0) return null;
  return (
    Math.round((ranked.reduce((sum, m) => sum + (m.rankPosition || 0), 0) / ranked.length) * 10) /
    10
  );
}
