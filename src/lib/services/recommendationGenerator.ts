import { prisma } from '@/lib/db';

export type RecommendationType = 'content' | 'technical' | 'outreach' | 'competitor';
export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface RecommendationData {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  impact: string;
  action: {
    type: 'analyze' | 'generate' | 'external';
    label: string;
    data?: Record<string, unknown>;
  };
}

interface TopicVisibility {
  id: string;
  name: string;
  visibility: number;
  totalPrompts: number;
  mentionedPrompts: number;
}

interface ContentGap {
  domain: string;
  url: string;
  competitors: string[];
  citationCount: number;
}

interface CompetitorWin {
  promptId: string;
  promptText: string;
  competitor: string;
  theirRank: number;
  yourRank: number | null;
}

export class RecommendationGenerator {
  async generate(brandId: string): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Fetch brand with competitors
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { competitors: true },
    });

    if (!brand) return [];

    // 1. Find low visibility topics
    const lowVisibilityTopics = await this.findLowVisibilityTopics(brandId, brand.name);
    for (const topic of lowVisibilityTopics) {
      recommendations.push({
        type: 'content',
        priority: topic.visibility < 20 ? 'high' : 'medium',
        title: `Improve visibility for "${topic.name}"`,
        description: `Your visibility is only ${topic.visibility.toFixed(0)}% for this topic (${topic.mentionedPrompts}/${topic.totalPrompts} prompts mention you)`,
        impact: `Could increase overall visibility by ${Math.min(15, Math.round((100 - topic.visibility) / 10))}%`,
        action: {
          type: 'generate',
          label: 'Generate Content',
          data: { topicId: topic.id, topicName: topic.name },
        },
      });
    }

    // 2. Find content gaps (sources citing competitors but not brand)
    const contentGaps = await this.findContentGaps(brandId, brand.name);
    for (const gap of contentGaps) {
      recommendations.push({
        type: 'outreach',
        priority: gap.citationCount > 5 ? 'high' : 'medium',
        title: `Get listed on ${gap.domain}`,
        description: `This source mentions ${gap.competitors.slice(0, 3).join(', ')}${gap.competitors.length > 3 ? ` and ${gap.competitors.length - 3} more` : ''} but not you`,
        impact: `Cited in ${gap.citationCount} AI responses`,
        action: {
          type: 'external',
          label: 'View Source',
          data: { url: gap.url },
        },
      });
    }

    // 3. Find prompts where competitors outrank brand
    const competitorWins = await this.findCompetitorWins(brandId, brand.name);
    for (const win of competitorWins) {
      recommendations.push({
        type: 'competitor',
        priority: 'high',
        title: `${win.competitor} outranking you`,
        description: `For "${win.promptText.slice(0, 60)}${win.promptText.length > 60 ? '...' : ''}"`,
        impact: `They rank #${win.theirRank}${win.yourRank ? ` vs your #${win.yourRank}` : ', you are not mentioned'}`,
        action: {
          type: 'analyze',
          label: 'Analyze Gap',
          data: { promptId: win.promptId },
        },
      });
    }

    // 4. Add technical recommendations based on page analysis (if available)
    const technicalRecs = await this.findTechnicalIssues(brandId);
    recommendations.push(...technicalRecs);

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 20); // Limit to top 20
  }

  private async findLowVisibilityTopics(
    brandId: string,
    brandName: string
  ): Promise<TopicVisibility[]> {
    const topics = await prisma.topic.findMany({
      where: { brandId },
      include: {
        prompts: {
          include: {
            responses: {
              include: { mentions: true },
            },
          },
        },
      },
    });

    const results: TopicVisibility[] = [];
    const lowerBrand = brandName.toLowerCase();

    for (const topic of topics) {
      let totalPrompts = 0;
      let mentionedPrompts = 0;

      for (const prompt of topic.prompts) {
        totalPrompts++;
        const hasBrandMention = prompt.responses.some((r) =>
          r.mentions.some((m) => m.brandName.toLowerCase() === lowerBrand && m.brandId !== null)
        );
        if (hasBrandMention) mentionedPrompts++;
      }

      if (totalPrompts > 0) {
        const visibility = (mentionedPrompts / totalPrompts) * 100;
        if (visibility < 50) {
          results.push({
            id: topic.id,
            name: topic.name,
            visibility,
            totalPrompts,
            mentionedPrompts,
          });
        }
      }
    }

    return results.sort((a, b) => a.visibility - b.visibility).slice(0, 5);
  }

  private async findContentGaps(brandId: string, brandName: string): Promise<ContentGap[]> {
    // Find sources that cite competitors but not brand
    const sources = await prisma.citedSource.findMany({
      where: {
        response: {
          prompt: {
            topic: { brandId },
          },
        },
      },
      include: {
        response: {
          include: {
            mentions: true,
          },
        },
      },
    });

    const gapMap = new Map<
      string,
      { domain: string; url: string; competitors: Set<string>; count: number }
    >();
    const lowerBrand = brandName.toLowerCase();

    for (const source of sources) {
      const hasBrand = source.response.mentions.some(
        (m) => m.brandName.toLowerCase() === lowerBrand
      );
      const competitorMentions = source.response.mentions.filter((m) => m.competitorId !== null);

      if (!hasBrand && competitorMentions.length > 0) {
        const existing = gapMap.get(source.domain) || {
          domain: source.domain,
          url: source.url,
          competitors: new Set<string>(),
          count: 0,
        };

        competitorMentions.forEach((m) => existing.competitors.add(m.brandName));
        existing.count++;
        gapMap.set(source.domain, existing);
      }
    }

    return Array.from(gapMap.values())
      .map((g) => ({
        domain: g.domain,
        url: g.url,
        competitors: Array.from(g.competitors),
        citationCount: g.count,
      }))
      .sort((a, b) => b.citationCount - a.citationCount)
      .slice(0, 5);
  }

  private async findCompetitorWins(brandId: string, brandName: string): Promise<CompetitorWin[]> {
    const responses = await prisma.lLMResponse.findMany({
      where: {
        prompt: {
          topic: { brandId },
        },
      },
      include: {
        prompt: true,
        mentions: true,
      },
    });

    const wins: CompetitorWin[] = [];
    const lowerBrand = brandName.toLowerCase();

    for (const response of responses) {
      const brandMention = response.mentions.find((m) => m.brandName.toLowerCase() === lowerBrand);
      const competitorMentions = response.mentions.filter(
        (m) => m.competitorId !== null && m.rankPosition !== null
      );

      for (const competitor of competitorMentions) {
        const theirRank = competitor.rankPosition!;
        const yourRank = brandMention?.rankPosition || null;

        // Competitor wins if they have better rank or we're not mentioned
        if (!yourRank || theirRank < yourRank) {
          wins.push({
            promptId: response.promptId,
            promptText: response.prompt.text,
            competitor: competitor.brandName,
            theirRank,
            yourRank,
          });
        }
      }
    }

    // Deduplicate by prompt and take top performers
    const uniqueWins = new Map<string, CompetitorWin>();
    for (const win of wins) {
      const key = `${win.promptId}-${win.competitor}`;
      if (!uniqueWins.has(key) || win.theirRank < uniqueWins.get(key)!.theirRank) {
        uniqueWins.set(key, win);
      }
    }

    return Array.from(uniqueWins.values())
      .sort((a, b) => a.theirRank - b.theirRank)
      .slice(0, 5);
  }

  private async findTechnicalIssues(brandId: string): Promise<RecommendationData[]> {
    // Check for common technical issues
    const recommendations: RecommendationData[] = [];

    // Check if brand has topics
    const topicCount = await prisma.topic.count({ where: { brandId } });
    if (topicCount === 0) {
      recommendations.push({
        type: 'technical',
        priority: 'high',
        title: 'Add tracking topics',
        description: 'You have no topics configured. Add topics to start tracking visibility.',
        impact: 'Cannot track visibility without topics',
        action: {
          type: 'generate',
          label: 'Generate Topics',
          data: {},
        },
      });
    }

    // Check for recent scans
    const recentResponses = await prisma.lLMResponse.findFirst({
      where: {
        prompt: {
          topic: { brandId },
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (!recentResponses && topicCount > 0) {
      recommendations.push({
        type: 'technical',
        priority: 'medium',
        title: 'Run visibility scan',
        description: 'No recent scans found. Run a scan to get current visibility data.',
        impact: 'Data may be outdated',
        action: {
          type: 'analyze',
          label: 'Run Scan',
          data: {},
        },
      });
    }

    return recommendations;
  }

  async saveRecommendations(brandId: string, recommendations: RecommendationData[]) {
    // Clear old pending recommendations
    await prisma.recommendation.deleteMany({
      where: {
        brandId,
        status: 'PENDING',
      },
    });

    // Create new recommendations
    await prisma.recommendation.createMany({
      data: recommendations.map((rec) => ({
        brandId,
        type: rec.type.toUpperCase() as 'CONTENT' | 'TECHNICAL' | 'OUTREACH' | 'COMPETITOR',
        priority: rec.priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
        title: rec.title,
        description: rec.description,
        impact: rec.impact,
        actionType: rec.action.type,
        actionLabel: rec.action.label,
        actionData: rec.action.data ? JSON.parse(JSON.stringify(rec.action.data)) : undefined,
      })),
    });
  }
}

export const recommendationGenerator = new RecommendationGenerator();
