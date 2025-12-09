import { createClient } from '@/lib/supabase/server';
import { generatePrompts, getSeedPrompts } from '@/lib/generators';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, topicId } = await params;
    const { useSeed = false } = await req.json();

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

    // Check topic belongs to this brand
    const { data: topic } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .eq('brand_id', id)
      .single();

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    let promptTexts: string[];

    if (useSeed) {
      promptTexts = getSeedPrompts(topic.name);
    } else {
      const competitorNames = (brand.competitors || []).map((c: { name: string }) => c.name);
      promptTexts = await generatePrompts(topic.name, brand.name, competitorNames, 10);
    }

    if (promptTexts.length === 0) {
      return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
    }

    // Insert prompts
    const promptsToInsert = promptTexts.map((text) => ({
      text,
      topic_id: topicId,
    }));

    const { data: prompts, error: insertError } = await supabase
      .from('prompts')
      .insert(promptsToInsert)
      .select();

    if (insertError) {
      console.error('Failed to insert prompts:', insertError);
      return NextResponse.json({ error: 'Failed to create prompts' }, { status: 500 });
    }

    // Transform to camelCase
    const formatted = (prompts || []).map((p) => ({
      id: p.id,
      text: p.text,
      topicId: p.topic_id,
      createdAt: p.created_at,
    }));

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Failed to generate prompts:', error);
    return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
  }
}
