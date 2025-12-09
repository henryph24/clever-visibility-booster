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

    // Get prompts with responses
    const { data: prompts } = await supabase
      .from('prompts')
      .select(
        `
        id,
        text,
        created_at,
        topics!inner (
          name,
          brand_id
        ),
        llm_responses (
          id,
          provider,
          created_at,
          brand_mentions (brand_name, rank_position),
          cited_sources (domain)
        )
      `
      )
      .eq('topics.brand_id', id);

    const flatData: {
      topic: string;
      prompt: string;
      provider: string;
      mentioned: boolean;
      rank: number | null;
      citedSources: string;
      responseDate: string;
    }[] = [];

    for (const prompt of prompts || []) {
      const responses = prompt.llm_responses || [];

      if (responses.length === 0) {
        flatData.push({
          topic: prompt.topics?.name || '',
          prompt: prompt.text,
          provider: 'N/A',
          mentioned: false,
          rank: null,
          citedSources: '',
          responseDate: prompt.created_at,
        });
      } else {
        for (const response of responses) {
          const brandMention = (response.brand_mentions || []).find(
            (m: { brand_name: string }) => m.brand_name.toLowerCase() === brand.name.toLowerCase()
          );
          flatData.push({
            topic: prompt.topics?.name || '',
            prompt: prompt.text,
            provider: response.provider,
            mentioned: !!brandMention,
            rank: brandMention?.rank_position || null,
            citedSources: (response.cited_sources || [])
              .map((s: { domain: string }) => s.domain)
              .join('; '),
            responseDate: response.created_at,
          });
        }
      }
    }

    const csv = generateCSV(flatData, [
      { key: 'topic', header: 'Topic' },
      { key: 'prompt', header: 'Prompt' },
      { key: 'provider', header: 'LLM Provider' },
      { key: 'mentioned', header: 'Brand Mentioned' },
      { key: 'rank', header: 'Rank Position' },
      { key: 'citedSources', header: 'Cited Sources' },
      { key: 'responseDate', header: 'Response Date' },
    ]);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="prompts-${brand.name}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return new Response('Export failed', { status: 500 });
  }
}
