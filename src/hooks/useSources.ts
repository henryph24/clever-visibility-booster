'use client';

import { useCallback, useEffect, useState } from 'react';

interface DomainStats {
  domain: string;
  totalCitations: number;
  mentionsYourBrand: number;
  mentionsCompetitors: number;
  urls: { url: string; title: string | null; count: number }[];
}

interface ContentGap {
  domain: string;
  url: string;
  title: string | null;
  mentionedCompetitors: string[];
  prompt: string;
}

export function useSources(brandId: string) {
  const [data, setData] = useState<DomainStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    if (!brandId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/brands/${brandId}/sources`);
      if (!response.ok) throw new Error('Failed to fetch sources');
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
    fetchSources();
  }, [fetchSources]);

  return { data, isLoading, error, refetch: fetchSources };
}

export function useContentGaps(brandId: string) {
  const [data, setData] = useState<ContentGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGaps = useCallback(async () => {
    if (!brandId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/brands/${brandId}/sources/gaps`);
      if (!response.ok) throw new Error('Failed to fetch content gaps');
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
    fetchGaps();
  }, [fetchGaps]);

  return { data, isLoading, error, refetch: fetchGaps };
}
