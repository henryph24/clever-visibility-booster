'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompetitorStats } from '@/hooks/useCompetitors';
import { Users } from 'lucide-react';

interface CompetitorOverviewCardsProps {
  brandId: string;
}

export function CompetitorOverviewCards({ brandId }: CompetitorOverviewCardsProps) {
  const { data, isLoading } = useCompetitorStats(brandId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.competitors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No competitors added</h3>
        <p className="mt-2 text-muted-foreground">
          Add competitors to compare your AI visibility against them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data.competitors.map((competitor) => (
        <Card key={competitor.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{competitor.name}</CardTitle>
            <CardDescription>{competitor.domain}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <span className="font-medium">{competitor.visibilityPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Rank</span>
                <span className="font-medium">
                  {competitor.avgRank ? `#${competitor.avgRank}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">You win</span>
                <span>{competitor.losses} prompts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">They win</span>
                <span>{competitor.wins} prompts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
