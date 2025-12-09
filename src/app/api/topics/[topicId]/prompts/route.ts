import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId } = await params;
    const { searchParams } = new URL(req.url);
    const withResponses = searchParams.get('withResponses') === 'true';

    // Get topic with brand to check ownership
    const { data: topic } = await supabase
      .from('topics')
      .select('*, brands!inner (user_id, id)')
      .eq('id', topicId)
      .single();

    if (!topic || topic.brands?.user_id !== user.id) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (withResponses) {
      const { data: promptsWithResponses } = await supabase
        .from('prompts')
        .select(
          `
          id,
          text,
          llm_responses (
            id,
            provider,
            brand_mentions (brand_id)
          )
        `
        )
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      const result = (promptsWithResponses || []).map((prompt) => ({
        id: prompt.id,
        text: prompt.text,
        responses: (prompt.llm_responses || []).map(
          (response: {
            id: string;
            provider: string;
            brand_mentions: Array<{ brand_id: string | null }>;
          }) => {
            const brandMentions = response.brand_mentions || [];
            const mention = brandMentions.find((m) => m.brand_id === topic.brand_id);
            return {
              id: response.id,
              provider: response.provider,
              hasMention: !!mention,
              rank: null, // Would need additional query for rank
            };
          }
        ),
      }));
      return NextResponse.json(result);
    }

    const { data: prompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    // Transform to camelCase
    const formatted = (prompts || []).map((p) => ({
      id: p.id,
      text: p.text,
      topicId: p.topic_id,
      createdAt: p.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}
