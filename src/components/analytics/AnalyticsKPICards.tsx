'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, MousePointerClick, TrendingUp, Users } from 'lucide-react';

interface AnalyticsKPICardsProps {
  totals: {
    sessions: number;
    users: number;
    conversions: number;
    revenue: number;
  } | null;
  isLoading: boolean;
}

export function AnalyticsKPICards({ totals, isLoading }: AnalyticsKPICardsProps) {
  const kpis = [
    {
      title: 'AI Sessions',
      value: totals?.sessions || 0,
      icon: Users,
      format: (v: number) => v.toLocaleString(),
      description: 'Sessions from AI sources',
    },
    {
      title: 'Unique Users',
      value: totals?.users || 0,
      icon: MousePointerClick,
      format: (v: number) => v.toLocaleString(),
      description: 'Users from AI referrals',
    },
    {
      title: 'Conversions',
      value: totals?.conversions || 0,
      icon: TrendingUp,
      format: (v: number) => v.toLocaleString(),
      description: 'AI-attributed conversions',
    },
    {
      title: 'Revenue',
      value: totals?.revenue || 0,
      icon: DollarSign,
      format: (v: number) =>
        v.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      description: 'AI-attributed revenue',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              <p className="mt-1 text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.format(kpi.value)}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
