import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: brands, error } = await supabase
      .from('brands')
      .select(
        `
        *,
        competitors (*),
        topics (count),
        visibility_metrics (count)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    // Transform to match expected format
    const transformedBrands = brands?.map((brand) => ({
      id: brand.id,
      name: brand.name,
      domain: brand.domain,
      industry: brand.industry,
      userId: brand.user_id,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
      competitors: brand.competitors,
      _count: {
        topics: brand.topics?.[0]?.count || 0,
        metrics: brand.visibility_metrics?.[0]?.count || 0,
      },
    }));

    return NextResponse.json(transformedBrands);
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, domain, industry } = await req.json();

    if (!name || !domain) {
      return NextResponse.json({ error: 'Name and domain are required' }, { status: 400 });
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        name,
        domain,
        industry,
        user_id: user.id,
      })
      .select('*, competitors (*)')
      .single();

    if (error) {
      console.error('Failed to create brand:', error);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    // Transform to camelCase
    const transformedBrand = {
      id: brand.id,
      name: brand.name,
      domain: brand.domain,
      industry: brand.industry,
      userId: brand.user_id,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
      competitors: brand.competitors || [],
    };

    return NextResponse.json(transformedBrand, { status: 201 });
  } catch (error) {
    console.error('Failed to create brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
