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

    // Get all cited sources for this brand's prompts via the response chain
    const { data: sources } = await supabase
      .from('cited_sources')
      .select(
        `
        *,
        llm_responses!inner (
          id,
          prompts!inner (
            topics!inner (brand_id)
          ),
          brand_mentions (brand_id, competitor_id)
        )
      `
      )
      .eq('llm_responses.prompts.topics.brand_id', id);

    // Group by domain
    const domainStats = new Map<
      string,
      {
        domain: string;
        totalCitations: number;
        mentionsYourBrand: number;
        mentionsCompetitors: number;
        urls: { url: string; title: string | null; count: number }[];
      }
    >();

    for (const source of sources || []) {
      const existing = domainStats.get(source.domain) || {
        domain: source.domain,
        totalCitations: 0,
        mentionsYourBrand: 0,
        mentionsCompetitors: 0,
        urls: [],
      };

      existing.totalCitations++;

      const mentions = source.llm_responses?.brand_mentions || [];

      // Check if response mentions your brand
      if (mentions.some((m: { brand_id: string | null }) => m.brand_id === id)) {
        existing.mentionsYourBrand++;
      }

      // Check if response mentions competitors
      if (mentions.some((m: { competitor_id: string | null }) => m.competitor_id !== null)) {
        existing.mentionsCompetitors++;
      }

      // Track URL occurrences
      const urlEntry = existing.urls.find((u) => u.url === source.url);
      if (urlEntry) {
        urlEntry.count++;
      } else {
        existing.urls.push({ url: source.url, title: source.title, count: 1 });
      }

      domainStats.set(source.domain, existing);
    }

    const result = Array.from(domainStats.values())
      .sort((a, b) => b.totalCitations - a.totalCitations)
      .map((d) => ({
        ...d,
        urls: d.urls.sort((a, b) => b.count - a.count).slice(0, 5),
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}
