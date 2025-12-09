import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; competitorId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, competitorId } = await params;

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

    // Check competitor exists and belongs to brand
    const { data: competitor } = await supabase
      .from('competitors')
      .select('id')
      .eq('id', competitorId)
      .eq('brand_id', id)
      .single();

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    const { error } = await supabase.from('competitors').delete().eq('id', competitorId);

    if (error) {
      console.error('Failed to delete competitor:', error);
      return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete competitor:', error);
    return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
  }
}
