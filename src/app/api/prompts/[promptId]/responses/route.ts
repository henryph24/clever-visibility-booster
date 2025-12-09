import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ promptId: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptId } = await params;

    // Fetch prompt with topic and brand to check ownership
    const { data: prompt } = await supabase
      .from('prompts')
      .select(
        `
        *,
        topics (
          *,
          brands (user_id)
        )
      `
      )
      .eq('id', promptId)
      .single();

    if (!prompt || prompt.topics?.brands?.user_id !== user.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Fetch responses with mentions and sources
    const { data: responses, error } = await supabase
      .from('llm_responses')
      .select(
        `
        *,
        brand_mentions (*),
        cited_sources (*)
      `
      )
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch responses:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    const result = responses?.map((response) => ({
      id: response.id,
      provider: response.provider,
      responseText: response.response_text,
      mentions: (response.brand_mentions || []).map((m: Record<string, unknown>) => ({
        brandName: m.brand_name,
        rankPosition: m.rank_position,
        isCited: m.is_cited,
        context: m.context,
      })),
      sources: (response.cited_sources || []).map((s: Record<string, unknown>) => ({
        url: s.url,
        domain: s.domain,
        title: s.title,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
