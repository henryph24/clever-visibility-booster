'use client';

import { CompetitorMentionsChart } from '@/components/dashboard/CompetitorMentionsChart';
import { KPICards } from '@/components/dashboard/KPICards';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { VisibilityTrendChart } from '@/components/dashboard/VisibilityTrendChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBrand } from '@/contexts/BrandContext';
import { useCompetitorMetrics, useMetrics, useTrends } from '@/hooks/useMetrics';
import { useState } from 'react';

export default function BrandOverviewPage() {
  const { brand, isLoading: brandLoading } = useBrand();
  const [trendDays, setTrendDays] = useState(30);

  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useMetrics(brand?.id || '');

  const {
    data: trends,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useTrends(brand?.id || '', trendDays);

  const {
    data: competitors,
    isLoading: competitorsLoading,
    refetch: refetchCompetitors,
  } = useCompetitorMetrics(brand?.id || '');

  const handleRefresh = async () => {
    await Promise.all([refetchMetrics(), refetchTrends(), refetchCompetitors()]);
  };

  const handleRangeChange = (days: number) => {
    setTrendDays(days);
  };

  if (brandLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!brand) {
    return <div>Brand not found</div>;
  }

  const hasData = metrics && (metrics.promptCount > 0 || metrics.totalResponses > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{brand.name}</h1>
          <p className="text-muted-foreground">AI Visibility Overview</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} />
      </div>

      <KPICards
        metrics={
          metrics || {
            visibilityPct: 0,
            avgRank: null,
            citationCount: 0,
            promptCount: 0,
          }
        }
        isLoading={metricsLoading}
      />

      {hasData ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <VisibilityTrendChart
            data={trends}
            isLoading={trendsLoading}
            onRangeChange={handleRangeChange}
          />
          <CompetitorMentionsChart data={competitors} isLoading={competitorsLoading} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your brand to start tracking AI visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
              <li>Add competitors in the Competitors tab</li>
              <li>Configure topics and prompts in the Prompts tab</li>
              <li>Run your first visibility scan</li>
              <li>Review results and recommendations</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
