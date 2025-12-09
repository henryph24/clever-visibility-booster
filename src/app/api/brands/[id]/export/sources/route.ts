import { createClient } from '@/lib/supabase/server';
import { generateCSV } from '@/lib/export/csv';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Check brand ownership
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return new Response('Brand not found', { status: 404 });
    }

    // Get cited sources for this brand's prompts
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

    const domainStats = new Map<
      string,
      {
        domain: string;
        totalCitations: number;
        uniqueUrls: Set<string>;
        mentionsYourBrand: number;
        mentionsCompetitors: number;
      }
    >();

    for (const source of sources || []) {
      const existing = domainStats.get(source.domain) || {
        domain: source.domain,
        totalCitations: 0,
        uniqueUrls: new Set<string>(),
        mentionsYourBrand: 0,
        mentionsCompetitors: 0,
      };

      existing.totalCitations++;
      existing.uniqueUrls.add(source.url);

      const mentions = source.llm_responses?.brand_mentions || [];

      if (mentions.some((m: { brand_id: string | null }) => m.brand_id === id)) {
        existing.mentionsYourBrand++;
      }
      if (mentions.some((m: { competitor_id: string | null }) => m.competitor_id !== null)) {
        existing.mentionsCompetitors++;
      }

      domainStats.set(source.domain, existing);
    }

    const data = Array.from(domainStats.values()).map((d) => ({
      domain: d.domain,
      totalCitations: d.totalCitations,
      uniqueUrls: d.uniqueUrls.size,
      mentionsYourBrand: d.mentionsYourBrand,
      mentionsCompetitors: d.mentionsCompetitors,
    }));

    const csv = generateCSV(data, [
      { key: 'domain', header: 'Domain' },
      { key: 'totalCitations', header: 'Total Citations' },
      { key: 'uniqueUrls', header: 'Unique URLs' },
      { key: 'mentionsYourBrand', header: 'Mentions Your Brand' },
      { key: 'mentionsCompetitors', header: 'Mentions Competitors' },
    ]);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sources-${brand.name}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return new Response('Export failed', { status: 500 });
  }
}
