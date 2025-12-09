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
      .select('provider, property_id, last_sync_at, created_at')
      .eq('brand_id', brandId)
      .single();

    if (!connection) {
      return NextResponse.json({
        connected: false,
        provider: null,
        propertyId: null,
        lastSyncAt: null,
      });
    }

    // Get summary of AI traffic data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trafficSummary } = await supabase.rpc('aggregate_traffic', {
      p_brand_id: brandId,
      p_start_date: thirtyDaysAgo.toISOString(),
    });

    const summary = trafficSummary?.[0] || {
      total_sessions: 0,
      total_users: 0,
      total_conversions: 0,
      total_revenue: 0,
    };

    return NextResponse.json({
      connected: true,
      provider: connection.provider,
      propertyId: connection.property_id,
      lastSyncAt: connection.last_sync_at,
      connectedAt: connection.created_at,
      summary: {
        totalSessions: summary.total_sessions || 0,
        totalUsers: summary.total_users || 0,
        totalConversions: summary.total_conversions || 0,
        totalRevenue: summary.total_revenue || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch analytics status:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics status' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    await supabase.from('analytics_connections').delete().eq('brand_id', brandId);

    // Optionally delete historical data
    await supabase.from('ai_traffic_data').delete().eq('brand_id', brandId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect analytics:', error);
    return NextResponse.json({ error: 'Failed to disconnect analytics' }, { status: 500 });
  }
}
