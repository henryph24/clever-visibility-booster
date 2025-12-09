import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { pageAnalyzer } from '@/lib/services/pageAnalyzer';

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
    const { url, content, topicId } = await req.json();

    // Check brand ownership
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    let topic = null;
    if (topicId) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      topic = topicData;
    }

    const analysis = await pageAnalyzer.analyze({
      url,
      content,
      brandName: brand.name,
      topicContext: topic?.name,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Failed to analyze page:', error);
    return NextResponse.json({ error: 'Failed to analyze page' }, { status: 500 });
  }
}
