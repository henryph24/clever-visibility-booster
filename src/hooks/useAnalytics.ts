'use client';

import { useCallback, useEffect, useState } from 'react';

interface AnalyticsStatus {
  connected: boolean;
  provider: string | null;
  propertyId: string | null;
  lastSyncAt: string | null;
  connectedAt?: string;
  summary?: {
    totalSessions: number;
    totalUsers: number;
    totalConversions: number;
    totalRevenue: number;
  };
}

interface TrafficSource {
  source: string;
  displayName: string;
  sessions: number;
  users: number;
  engagedSessions: number;
  conversions: number;
  revenue: number;
  engagementRate: number;
  conversionRate: number;
}

interface TrafficTrend {
  date: string;
  sessions: number;
  users: number;
  conversions: number;
  revenue: number;
}

interface TrafficData {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totals: {
    sessions: number;
    users: number;
    engagedSessions: number;
    conversions: number;
    revenue: number;
    avgBounceRate: number | null;
    avgSessionDuration: number | null;
  };
  bySource: TrafficSource[];
  trends: TrafficTrend[];
  lastSyncAt: string | null;
}

interface GA4Property {
  id: string;
  name: string;
}

export function useAnalyticsStatus(brandId: string) {
  const [data, setData] = useState<AnalyticsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      const res = await window.fetch(`/api/brands/${brandId}/analytics`);
      if (!res.ok) throw new Error('Failed to fetch analytics status');
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useAnalyticsTraffic(brandId: string, days: number = 30) {
  const [data, setData] = useState<TrafficData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      const res = await window.fetch(`/api/brands/${brandId}/analytics/traffic?days=${days}`);
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.connected === false) {
          setData(null);
          setError(null);
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch traffic data');
      }
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useAnalyticsConnect(brandId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!brandId) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await window.fetch(`/api/brands/${brandId}/analytics/connect`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to initiate connection');
      }
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [brandId]);

  return { connect, isLoading, error };
}

export function useAnalyticsDisconnect(brandId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(async () => {
    if (!brandId) return false;

    setIsLoading(true);
    setError(null);
    try {
      const res = await window.fetch(`/api/brands/${brandId}/analytics`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  return { disconnect, isLoading, error };
}

export function useAnalyticsSync(brandId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (!brandId) return null;

    setIsLoading(true);
    setError(null);
    try {
      const res = await window.fetch(`/api/brands/${brandId}/analytics/sync`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to sync');
      }
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  return { sync, isLoading, error };
}

export function useGA4Properties(brandId: string) {
  const [data, setData] = useState<GA4Property[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      const res = await window.fetch(`/api/brands/${brandId}/analytics/properties`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch properties');
      }
      const { properties } = await res.json();
      setData(properties);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useFinalizeAnalytics(brandId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalize = useCallback(
    async (propertyId: string) => {
      if (!brandId || !propertyId) return false;

      setIsLoading(true);
      setError(null);
      try {
        const res = await window.fetch(`/api/brands/${brandId}/analytics/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to finalize connection');
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [brandId]
  );

  return { finalize, isLoading, error };
}
