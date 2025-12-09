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
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);

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
      .select('last_sync_at')
      .eq('brand_id', brandId)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'No analytics connection found', connected: false },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all traffic data for the period
    const { data: trafficData } = await supabase
      .from('ai_traffic_data')
      .select('*')
      .eq('brand_id', brandId)
      .gte('date', startDate.toISOString());

    // Format source data with friendly names
    const sourceNameMap: Record<string, string> = {
      'chat.openai.com': 'ChatGPT',
      'chatgpt.com': 'ChatGPT',
      'claude.ai': 'Claude',
      'perplexity.ai': 'Perplexity',
      'gemini.google.com': 'Gemini',
      'bard.google.com': 'Google Bard',
      'copilot.microsoft.com': 'Microsoft Copilot',
      'bing.com/chat': 'Bing Chat',
      'you.com': 'You.com',
      'poe.com': 'Poe',
      'phind.com': 'Phind',
      'character.ai': 'Character.AI',
    };

    // Group by source
    const sourceGroups = new Map<
      string,
      {
        sessions: number;
        users: number;
        engagedSessions: number;
        conversions: number;
        revenue: number;
      }
    >();

    // Group by date
    const dateGroups = new Map<
      string,
      { sessions: number; users: number; conversions: number; revenue: number }
    >();

    // Calculate totals
    let totalSessions = 0;
    let totalUsers = 0;
    let totalEngagedSessions = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let bounceRateSum = 0;
    let bounceRateCount = 0;
    let durationSum = 0;
    let durationCount = 0;

    for (const row of trafficData || []) {
      // Aggregate by source
      const sourceData = sourceGroups.get(row.source) || {
        sessions: 0,
        users: 0,
        engagedSessions: 0,
        conversions: 0,
        revenue: 0,
      };
      sourceData.sessions += row.sessions || 0;
      sourceData.users += row.users || 0;
      sourceData.engagedSessions += row.engaged_sessions || 0;
      sourceData.conversions += row.conversions || 0;
      sourceData.revenue += row.revenue || 0;
      sourceGroups.set(row.source, sourceData);

      // Aggregate by date
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      const dateData = dateGroups.get(dateKey) || {
        sessions: 0,
        users: 0,
        conversions: 0,
        revenue: 0,
      };
      dateData.sessions += row.sessions || 0;
      dateData.users += row.users || 0;
      dateData.conversions += row.conversions || 0;
      dateData.revenue += row.revenue || 0;
      dateGroups.set(dateKey, dateData);

      // Totals
      totalSessions += row.sessions || 0;
      totalUsers += row.users || 0;
      totalEngagedSessions += row.engaged_sessions || 0;
      totalConversions += row.conversions || 0;
      totalRevenue += row.revenue || 0;

      if (row.bounce_rate !== null) {
        bounceRateSum += row.bounce_rate;
        bounceRateCount++;
      }
      if (row.avg_session_duration !== null) {
        durationSum += row.avg_session_duration;
        durationCount++;
      }
    }

    const bySource = Array.from(sourceGroups.entries()).map(([source, data]) => ({
      source,
      displayName: sourceNameMap[source] || source,
      sessions: data.sessions,
      users: data.users,
      engagedSessions: data.engagedSessions,
      conversions: data.conversions,
      revenue: data.revenue,
      engagementRate: data.sessions ? (data.engagedSessions / data.sessions) * 100 : 0,
      conversionRate: data.sessions ? (data.conversions / data.sessions) * 100 : 0,
    }));

    const trends = Array.from(dateGroups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        sessions: data.sessions,
        users: data.users,
        conversions: data.conversions,
        revenue: data.revenue,
      }));

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        days,
      },
      totals: {
        sessions: totalSessions,
        users: totalUsers,
        engagedSessions: totalEngagedSessions,
        conversions: totalConversions,
        revenue: totalRevenue,
        avgBounceRate: bounceRateCount > 0 ? bounceRateSum / bounceRateCount : null,
        avgSessionDuration: durationCount > 0 ? durationSum / durationCount : null,
      },
      bySource,
      trends,
      lastSyncAt: connection.last_sync_at,
    });
  } catch (error) {
    console.error('Failed to fetch traffic data:', error);
    return NextResponse.json({ error: 'Failed to fetch traffic data' }, { status: 500 });
  }
}
