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
      .select('id, name, competitors (*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get total responses for this brand's prompts using RPC
    const { data: responseCountData } = await supabase.rpc('count_brand_responses', {
      p_brand_id: id,
    });
    const totalResponses = responseCountData || 0;

    // Get brand mentions count using RPC
    const { data: brandMentionsData } = await supabase.rpc('count_brand_mentions', {
      p_brand_id: id,
    });
    const brandMentions = brandMentionsData || 0;

    // Get competitor mentions
    const competitorData = await Promise.all(
      (brand.competitors || []).map(async (competitor: { id: string; name: string }) => {
        const { data: mentionsData } = await supabase.rpc('count_competitor_mentions', {
          p_competitor_id: competitor.id,
        });
        const mentions = mentionsData || 0;
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
