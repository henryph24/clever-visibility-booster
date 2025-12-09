import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { recommendationGenerator } from '@/lib/services/recommendationGenerator';
import type { RecommendationStatus, RecommendationType } from '@/types/supabase';

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
    const status = searchParams.get('status') || 'PENDING';
    const type = searchParams.get('type');

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

    let query = supabase.from('recommendations').select('*').eq('brand_id', id);

    if (status !== 'all') {
      query = query.eq('status', status as RecommendationStatus);
    }
    if (type) {
      query = query.eq('type', type.toUpperCase() as RecommendationType);
    }

    const { data: recommendations, error } = await query
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch recommendations:', error);
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }

    // Transform to frontend format
    const formatted = recommendations?.map((rec) => ({
      id: rec.id,
      type: rec.type.toLowerCase(),
      priority: rec.priority.toLowerCase(),
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      action: {
        type: rec.action_type,
        label: rec.action_label,
        data: rec.action_data,
      },
      status: rec.status.toLowerCase(),
      createdAt: rec.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

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

    // Generate new recommendations
    const recommendations = await recommendationGenerator.generate(id);

    // Save them
    await recommendationGenerator.saveRecommendations(id, recommendations);

    // Return the new recommendations
    const { data: saved } = await supabase
      .from('recommendations')
      .select('*')
      .eq('brand_id', id)
      .eq('status', 'PENDING')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    const formatted = saved?.map((rec) => ({
      id: rec.id,
      type: rec.type.toLowerCase(),
      priority: rec.priority.toLowerCase(),
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      action: {
        type: rec.action_type,
        label: rec.action_label,
        data: rec.action_data,
      },
      status: rec.status.toLowerCase(),
      createdAt: rec.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { recommendationId, status } = await req.json();

    if (!recommendationId || !status) {
      return NextResponse.json(
        { error: 'recommendationId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'DONE', 'DISMISSED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

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

    const { data: updated, error } = await supabase
      .from('recommendations')
      .update({ status: status.toUpperCase() })
      .eq('id', recommendationId)
      .eq('brand_id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update recommendation:', error);
      return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status.toLowerCase(),
    });
  } catch (error) {
    console.error('Failed to update recommendation:', error);
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
  }
}
