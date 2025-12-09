import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check brand ownership and get competitors
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name, domain, competitors (*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get total responses using RPC
    const { data: totalResponsesData } = await supabase.rpc('count_brand_responses', {
      p_brand_id: id,
    });
    const totalResponses = totalResponsesData || 0;

    // Get brand mentions
    const { data: brandMentions } = await supabase
      .from('brand_mentions')
      .select('rank_position')
      .eq('brand_id', id);

    const brandStats = {
      name: brand.name,
      domain: brand.domain,
      mentionCount: brandMentions?.length || 0,
      visibilityPct:
        totalResponses > 0 ? Math.round(((brandMentions?.length || 0) / totalResponses) * 100) : 0,
      avgRank: calculateAvgRank(brandMentions || []),
      isYourBrand: true,
    };

    // Get competitor statistics
    const competitorStats = await Promise.all(
      (brand.competitors || []).map(
        async (competitor: { id: string; name: string; domain: string }) => {
          const { data: mentions } = await supabase
            .from('brand_mentions')
            .select('rank_position')
            .eq('competitor_id', competitor.id);

          // Calculate wins/losses against your brand
          // Get prompts with responses that mention either brand or competitor
          const { data: promptResponses } = await supabase
            .from('prompts')
            .select(
              `
            id,
            topics!inner (brand_id),
            llm_responses (
              id,
              brand_mentions (brand_id, competitor_id, rank_position)
            )
          `
            )
            .eq('topics.brand_id', id);

          let wins = 0;
          let losses = 0;

          (promptResponses || []).forEach((prompt) => {
            (prompt.llm_responses || []).forEach(
              (response: {
                brand_mentions: Array<{
                  brand_id: string | null;
                  competitor_id: string | null;
                  rank_position: number | null;
                }>;
              }) => {
                const mentions = response.brand_mentions || [];
                const yourMention = mentions.find((m) => m.brand_id === id);
                const theirMention = mentions.find((m) => m.competitor_id === competitor.id);

                if (yourMention && theirMention) {
                  const yourRank = yourMention.rank_position || 999;
                  const theirRank = theirMention.rank_position || 999;
                  if (yourRank < theirRank) losses++;
                  else if (theirRank < yourRank) wins++;
                } else if (theirMention && !yourMention) {
                  wins++;
                } else if (yourMention && !theirMention) {
                  losses++;
                }
              }
            );
          });

          return {
            id: competitor.id,
            name: competitor.name,
            domain: competitor.domain,
            mentionCount: mentions?.length || 0,
            visibilityPct:
              totalResponses > 0 ? Math.round(((mentions?.length || 0) / totalResponses) * 100) : 0,
            avgRank: calculateAvgRank(mentions || []),
            wins,
            losses,
            isYourBrand: false,
          };
        }
      )
    );

    return NextResponse.json({ brand: brandStats, competitors: competitorStats, totalResponses });
  } catch (error) {
    console.error('Failed to fetch competitor stats:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor stats' }, { status: 500 });
  }
}

function calculateAvgRank(mentions: { rank_position: number | null }[]): number | null {
  const ranked = mentions.filter((m) => m.rank_position !== null);
  if (ranked.length === 0) return null;
  return (
    Math.round((ranked.reduce((sum, m) => sum + (m.rank_position || 0), 0) / ranked.length) * 10) /
    10
  );
}
