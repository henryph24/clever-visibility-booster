import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    const { data: competitors, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('brand_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch competitors:', error);
      return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
    }

    // Transform to camelCase
    const transformed = competitors?.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      brandId: c.brand_id,
      createdAt: c.created_at,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Failed to fetch competitors:', error);
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
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
    const { name, domain } = await req.json();

    if (!name || !domain) {
      return NextResponse.json({ error: 'Name and domain are required' }, { status: 400 });
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

    const { data: competitor, error } = await supabase
      .from('competitors')
      .insert({
        name,
        domain,
        brand_id: id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create competitor:', error);
      return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 });
    }

    // Transform to camelCase
    const transformed = {
      id: competitor.id,
      name: competitor.name,
      domain: competitor.domain,
      brandId: competitor.brand_id,
      createdAt: competitor.created_at,
    };

    return NextResponse.json(transformed, { status: 201 });
  } catch (error) {
    console.error('Failed to create competitor:', error);
    return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 });
  }
}
