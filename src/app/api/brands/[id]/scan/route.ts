import { createClient } from '@/lib/supabase/server';
import { llmQueryQueue } from '@/lib/queue';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Get prompts for this brand
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, topics!inner(brand_id)')
      .eq('topics.brand_id', id);

    if (!prompts || prompts.length === 0) {
      return NextResponse.json(
        { error: 'No prompts configured. Add topics and prompts first.' },
        { status: 400 }
      );
    }

    if (!llmQueryQueue) {
      return NextResponse.json(
        { error: 'Queue system not configured. Please set REDIS_URL.' },
        { status: 503 }
      );
    }

    // Use web-search-enabled providers for accurate AI visibility tracking
    // OpenAI (Responses API), Anthropic (web_search tool), Perplexity (native search)
    const job = await llmQueryQueue.add('scan-brand', {
      brandId: id,
      promptIds: prompts.map((p) => p.id),
      providers: ['OPENAI', 'ANTHROPIC', 'PERPLEXITY'],
    });

    return NextResponse.json({
      jobId: job.id,
      promptCount: prompts.length,
      message: 'Scan started',
    });
  } catch (error) {
    console.error('Failed to start scan:', error);
    return NextResponse.json({ error: 'Failed to start scan' }, { status: 500 });
  }
}
