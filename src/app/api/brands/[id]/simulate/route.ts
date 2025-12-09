import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { contentSimulator } from '@/lib/services/contentSimulator';
import type { Json } from '@/types/supabase';

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
    const { originalContent, modifiedContent, promptIds, providers } = await req.json();

    if (!originalContent || !modifiedContent || !promptIds?.length) {
      return NextResponse.json(
        { error: 'originalContent, modifiedContent, and promptIds are required' },
        { status: 400 }
      );
    }

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

    // Fetch prompts that belong to this brand's topics
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, text, topics!inner (brand_id)')
      .in('id', promptIds)
      .eq('topics.brand_id', id);

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ error: 'No valid prompts found' }, { status: 404 });
    }

    const results = await contentSimulator.simulate({
      brandName: brand.name,
      originalContent,
      modifiedContent,
      prompts: prompts.map((p) => ({ id: p.id, text: p.text })),
      providers,
    });

    // Save simulation result
    const { data: saved, error: saveError } = await supabase
      .from('simulation_results')
      .insert({
        brand_id: id,
        original_content: originalContent,
        modified_content: modifiedContent,
        prompt_ids: promptIds,
        results: results.prompts as unknown as Json,
        summary: results.summary as unknown as Json,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save simulation result:', saveError);
    }

    return NextResponse.json({
      id: saved?.id,
      ...results,
    });
  } catch (error) {
    console.error('Failed to run simulation:', error);
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 });
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
      .from('simulation_results')
      .select('id, summary, created_at, prompt_ids')
      .eq('brand_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Transform to camelCase
    const formatted = (history || []).map((item) => ({
      id: item.id,
      summary: item.summary,
      createdAt: item.created_at,
      promptIds: item.prompt_ids,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch simulation history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
