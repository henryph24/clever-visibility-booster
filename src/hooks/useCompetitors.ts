'use client';

import { useCallback, useEffect, useState } from 'react';

interface CompetitorStats {
  id: string;
  name: string;
  domain: string;
  mentionCount: number;
  visibilityPct: number;
  avgRank: number | null;
  wins: number;
  losses: number;
  isYourBrand: boolean;
}

interface BrandStats {
  name: string;
  domain: string;
  mentionCount: number;
  visibilityPct: number;
  avgRank: number | null;
  isYourBrand: boolean;
}

interface CompetitorStatsResponse {
  brand: BrandStats;
  competitors: CompetitorStats[];
  totalResponses: number;
}

export function useCompetitorStats(brandId: string) {
  const [data, setData] = useState<CompetitorStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!brandId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/brands/${brandId}/competitors/stats`);
      if (!response.ok) throw new Error('Failed to fetch competitor stats');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, isLoading, error, refetch: fetchStats };
}
