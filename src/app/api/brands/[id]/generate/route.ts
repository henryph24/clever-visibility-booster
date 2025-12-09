import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { contentGenerator, ContentType } from '@/lib/services/contentGenerator';

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
    const { topicId, contentType, referenceUrls, additionalContext } = await req.json();

    // Check brand ownership and get competitors
    const { data: brand } = await supabase
      .from('brands')
      .select('*, competitors (*)')
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

    if (topicId && !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Fetch reference content if URLs provided
    let referenceContent: string[] = [];
    if (referenceUrls?.length) {
      referenceContent = await contentGenerator.fetchReferenceContent(referenceUrls);
    }

    const result = await contentGenerator.generate({
      brandName: brand.name,
      brandDomain: brand.domain,
      topic: topic?.name || 'general',
      contentType: contentType as ContentType,
      referenceContent: referenceContent.length > 0 ? referenceContent : undefined,
      additionalContext,
      competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
    });

    // Save generated content
    const { data: saved, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        brand_id: id,
        topic_id: topic?.id || null,
        content_type: contentType.toUpperCase(),
        content: result.content,
        reference_urls: referenceUrls || [],
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save generated content:', saveError);
    }

    return NextResponse.json({
      id: saved?.id,
      content: result.content,
      wordCount: result.wordCount,
    });
  } catch (error) {
    console.error('Failed to generate content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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

    const { data: history } = await supabase
      .from('generated_content')
      .select('*, topics (name)')
      .eq('brand_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Transform to camelCase for frontend
    const formatted = (history || []).map((item) => ({
      id: item.id,
      brandId: item.brand_id,
      topicId: item.topic_id,
      contentType: item.content_type,
      content: item.content,
      referenceUrls: item.reference_urls,
      createdAt: item.created_at,
      topic: item.topics,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch generated content:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
