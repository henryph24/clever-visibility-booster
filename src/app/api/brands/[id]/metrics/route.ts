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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get latest metrics
    const { data: latestMetric } = await supabase
      .from('visibility_metrics')
      .select('*')
      .eq('brand_id', id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Get total prompts count using RPC
    const { data: promptCountData } = await supabase.rpc('count_brand_prompts', {
      p_brand_id: id,
    });
    const promptCount = promptCountData || 0;

    // Get brand mention statistics
    const { data: mentions } = await supabase
      .from('brand_mentions')
      .select('*, llm_responses (*)')
      .eq('brand_id', id);

    // Get total responses count using RPC
    const { data: totalResponsesData } = await supabase.rpc('count_brand_responses', {
      p_brand_id: id,
    });
    const totalResponses = totalResponsesData || 0;

    const mentionCount = mentions?.length || 0;
    const visibilityPct = totalResponses > 0 ? (mentionCount / totalResponses) * 100 : 0;
    const rankedMentions = mentions?.filter((m) => m.rank_position !== null) || [];
    const avgRank =
      rankedMentions.length > 0
        ? rankedMentions.reduce((sum, m) => sum + (m.rank_position || 0), 0) / rankedMentions.length
        : null;
    const citationCount = mentions?.filter((m) => m.is_cited).length || 0;

    return NextResponse.json({
      visibilityPct: latestMetric?.visibility_pct || visibilityPct,
      avgRank: latestMetric?.avg_rank || avgRank,
      citationCount: latestMetric?.citation_count || citationCount,
      promptCount,
      totalResponses,
      mentionCount,
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
