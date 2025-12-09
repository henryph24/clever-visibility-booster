'use client';

import { useCallback, useEffect, useState } from 'react';

interface Metrics {
  visibilityPct: number;
  avgRank: number | null;
  citationCount: number;
  promptCount: number;
  totalResponses: number;
  mentionCount: number;
}

interface TrendData {
  date: string;
  visibility: number;
}

interface CompetitorData {
  name: string;
  mentions: number;
  visibilityPct: number;
  isYourBrand?: boolean;
}

export function useMetrics(brandId: string) {
  const [data, setData] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!brandId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/brands/${brandId}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
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
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, isLoading, error, refetch: fetchMetrics };
}

export function useTrends(brandId: string, days: number = 30) {
  const [data, setData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!brandId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/brands/${brandId}/metrics/trends?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, days]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { data, isLoading, error, refetch: fetchTrends };
}

export function useCompetitorMetrics(brandId: string) {
  const [data, setData] = useState<CompetitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    if (!brandId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/brands/${brandId}/metrics/competitors`);
      if (!response.ok) throw new Error('Failed to fetch competitor metrics');
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
    fetchCompetitors();
  }, [fetchCompetitors]);

  return { data, isLoading, error, refetch: fetchCompetitors };
}
