import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase/admin';

// AI sources to track - domains that indicate AI-driven traffic
export const AI_REFERRAL_SOURCES = [
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'perplexity.ai',
  'gemini.google.com',
  'bard.google.com',
  'copilot.microsoft.com',
  'bing.com/chat',
  'you.com',
  'poe.com',
  'phind.com',
  'character.ai',
];

// Broader patterns for AI traffic detection
export const AI_SOURCE_PATTERNS = [
  /chatgpt/i,
  /openai/i,
  /claude/i,
  /anthropic/i,
  /perplexity/i,
  /gemini/i,
  /copilot/i,
  /ai.*assistant/i,
];

interface GA4Credentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface TrafficDataPoint {
  date: string;
  source: string;
  sessions: number;
  users: number;
  engagedSessions: number;
  conversions: number;
  revenue: number;
  bounceRate: number | null;
  avgSessionDuration: number | null;
}

export class GA4Service {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ANALYTICS_CLIENT_ID,
      process.env.GOOGLE_ANALYTICS_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/brands/analytics/callback`
    );
  }

  getAuthUrl(brandId: string): string {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: brandId,
    });
  }

  async exchangeCode(code: string): Promise<GA4Credentials> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<GA4Credentials> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
    };
  }

  async getValidCredentials(brandId: string): Promise<GA4Credentials | null> {
    const { data: connection } = await supabaseAdmin
      .from('analytics_connections')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (!connection) {
      return null;
    }

    // Check if token needs refresh (5 min buffer)
    if (new Date(connection.expires_at) <= new Date(Date.now() + 300000)) {
      const newCredentials = await this.refreshAccessToken(connection.refresh_token);

      await supabaseAdmin
        .from('analytics_connections')
        .update({
          access_token: newCredentials.accessToken,
          refresh_token: newCredentials.refreshToken,
          expires_at: newCredentials.expiresAt.toISOString(),
        })
        .eq('brand_id', brandId);

      return newCredentials;
    }

    return {
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      expiresAt: new Date(connection.expires_at),
    };
  }

  async listProperties(accessToken: string): Promise<Array<{ id: string; name: string }>> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: this.oauth2Client });

    const response = await analyticsAdmin.accountSummaries.list();
    const properties: Array<{ id: string; name: string }> = [];

    for (const account of response.data.accountSummaries || []) {
      for (const property of account.propertySummaries || []) {
        if (property.property && property.displayName) {
          // Extract property ID from format "properties/123456789"
          const propertyId = property.property.replace('properties/', '');
          properties.push({
            id: propertyId,
            name: `${account.displayName} - ${property.displayName}`,
          });
        }
      }
    }

    return properties;
  }

  async fetchAITrafficData(
    propertyId: string,
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<TrafficDataPoint[]> {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      authClient: this.createAuthClient(accessToken),
    });

    // Fetch traffic data with source breakdown
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'sessionSource' }, { name: 'sessionSourceMedium' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'engagedSessions' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      dimensionFilter: {
        orGroup: {
          expressions: AI_REFERRAL_SOURCES.map((source) => ({
            filter: {
              fieldName: 'sessionSource',
              stringFilter: {
                matchType: 'CONTAINS',
                value: source.split('.')[0], // Use first part of domain
                caseSensitive: false,
              },
            },
          })),
        },
      },
    });

    const trafficData: TrafficDataPoint[] = [];

    for (const row of response.rows || []) {
      const date = row.dimensionValues?.[0]?.value || '';
      const source = row.dimensionValues?.[1]?.value || '';
      const sourceMedium = row.dimensionValues?.[2]?.value || '';

      // Normalize the source to our known AI sources
      const normalizedSource = this.normalizeAISource(source, sourceMedium);
      if (!normalizedSource) continue;

      trafficData.push({
        date: this.formatDate(date),
        source: normalizedSource,
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        engagedSessions: parseInt(row.metricValues?.[2]?.value || '0', 10),
        conversions: parseInt(row.metricValues?.[3]?.value || '0', 10),
        revenue: parseFloat(row.metricValues?.[4]?.value || '0'),
        bounceRate: row.metricValues?.[5]?.value ? parseFloat(row.metricValues[5].value) : null,
        avgSessionDuration: row.metricValues?.[6]?.value
          ? parseFloat(row.metricValues[6].value)
          : null,
      });
    }

    return trafficData;
  }

  async fetchTotalTrafficData(
    propertyId: string,
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<{ sessions: number; conversions: number; revenue: number }> {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      authClient: this.createAuthClient(accessToken),
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'totalRevenue' }],
    });

    const row = response.rows?.[0];
    return {
      sessions: parseInt(row?.metricValues?.[0]?.value || '0', 10),
      conversions: parseInt(row?.metricValues?.[1]?.value || '0', 10),
      revenue: parseFloat(row?.metricValues?.[2]?.value || '0'),
    };
  }

  async syncTrafficData(brandId: string): Promise<{ synced: number }> {
    const { data: connection } = await supabaseAdmin
      .from('analytics_connections')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (!connection) {
      throw new Error('No analytics connection found');
    }

    const credentials = await this.getValidCredentials(brandId);
    if (!credentials) {
      throw new Error('Failed to get valid credentials');
    }

    // Fetch last 30 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const trafficData = await this.fetchAITrafficData(
      connection.property_id,
      credentials.accessToken,
      this.formatDateForAPI(startDate),
      this.formatDateForAPI(endDate)
    );

    // Upsert traffic data
    let synced = 0;
    for (const data of trafficData) {
      const { error } = await supabaseAdmin.from('ai_traffic_data').upsert(
        {
          brand_id: brandId,
          date: data.date,
          source: data.source,
          sessions: data.sessions,
          users: data.users,
          engaged_sessions: data.engagedSessions,
          conversions: data.conversions,
          revenue: data.revenue,
          bounce_rate: data.bounceRate,
          avg_session_duration: data.avgSessionDuration,
        },
        {
          onConflict: 'brand_id,date,source',
        }
      );

      if (!error) {
        synced++;
      }
    }

    // Update last sync timestamp
    await supabaseAdmin
      .from('analytics_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('brand_id', brandId);

    return { synced };
  }

  private createAuthClient(accessToken: string) {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return authClient as any;
  }

  private normalizeAISource(source: string, sourceMedium: string): string | null {
    const combined = `${source} ${sourceMedium}`.toLowerCase();

    // Check against known AI sources
    for (const aiSource of AI_REFERRAL_SOURCES) {
      if (combined.includes(aiSource.split('.')[0])) {
        return aiSource;
      }
    }

    // Check against patterns
    for (const pattern of AI_SOURCE_PATTERNS) {
      if (pattern.test(combined)) {
        return source.toLowerCase();
      }
    }

    return null;
  }

  private formatDate(yyyymmdd: string): string {
    // Convert YYYYMMDD to YYYY-MM-DD
    if (yyyymmdd.length === 8) {
      return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
    }
    return yyyymmdd;
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export const ga4Service = new GA4Service();
