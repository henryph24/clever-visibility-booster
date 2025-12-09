import { createClient } from '@/lib/supabase/server';
import { ga4Service } from '@/lib/analytics/ga4';
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

    const { id: brandId } = await params;

    // Check brand ownership
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Check if already connected
    const { data: existingConnection } = await supabase
      .from('analytics_connections')
      .select('id')
      .eq('brand_id', brandId)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Analytics already connected. Disconnect first to reconnect.' },
        { status: 400 }
      );
    }

    // Generate OAuth URL
    const authUrl = ga4Service.getAuthUrl(brandId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Failed to initiate analytics connection:', error);
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 });
  }
}
