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

    // Check brand ownership
    const { data: brand } = await supabase
      .from('brands')
      .select('id, competitors (*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Find sources that mention competitors but not the brand
    const { data: sources } = await supabase
      .from('cited_sources')
      .select(
        `
        *,
        llm_responses!inner (
          id,
          prompts!inner (
            text,
            topics!inner (brand_id)
          ),
          brand_mentions (brand_id, competitor_id, brand_name)
        )
      `
      )
      .eq('llm_responses.prompts.topics.brand_id', id);

    const gaps = (sources || [])
      .filter((source) => {
        const mentions = source.llm_responses?.brand_mentions || [];
        const hasBrandMention = mentions.some(
          (m: { brand_id: string | null }) => m.brand_id === id
        );
        const hasCompetitorMention = mentions.some(
          (m: { competitor_id: string | null }) => m.competitor_id !== null
        );
        return !hasBrandMention && hasCompetitorMention;
      })
      .map((source) => {
        const mentions = source.llm_responses?.brand_mentions || [];
        const competitorMentions = mentions
          .filter((m: { competitor_id: string | null }) => m.competitor_id !== null)
          .map((m: { brand_name: string }) => m.brand_name);

        return {
          domain: source.domain,
          url: source.url,
          title: source.title,
          mentionedCompetitors: Array.from(new Set(competitorMentions)),
          prompt: source.llm_responses?.prompts?.text,
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
