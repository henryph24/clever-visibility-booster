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
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Check brand ownership
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name, competitors (*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get visibility metrics over time
    const { data: metrics } = await supabase
      .from('visibility_metrics')
      .select('*')
      .eq('brand_id', id)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });

    // If no stored metrics, generate from responses
    if (!metrics || metrics.length === 0) {
      // Get responses with mentions for this brand's prompts
      const { data: responses } = await supabase
        .from('llm_responses')
        .select(
          `
          id,
          created_at,
          prompts!inner (
            topics!inner (brand_id)
          ),
          brand_mentions (brand_id)
        `
        )
        .eq('prompts.topics.brand_id', id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const byDate = new Map<string, { total: number; mentioned: number }>();
      for (const response of responses || []) {
        const dateKey = new Date(response.created_at).toISOString().split('T')[0];
        const current = byDate.get(dateKey) || { total: 0, mentioned: 0 };
        current.total++;
        if (
          (response.brand_mentions || []).some(
            (m: { brand_id: string | null }) => m.brand_id === id
          )
        ) {
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
      date: new Date(m.date).toISOString().split('T')[0],
      visibility: m.visibility_pct,
    }));

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
