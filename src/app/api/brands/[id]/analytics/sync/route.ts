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

    const { data: connection } = await supabase
      .from('analytics_connections')
      .select('id')
      .eq('brand_id', brandId)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No analytics connection found' }, { status: 400 });
    }

    const result = await ga4Service.syncTrafficData(brandId);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to sync analytics data:', error);
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
  }
}
