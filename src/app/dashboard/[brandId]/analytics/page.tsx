'use client';

import { AITrafficChart } from '@/components/analytics/AITrafficChart';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';
import { ConnectGA4Card } from '@/components/analytics/ConnectGA4Card';
import { SourceBreakdownChart } from '@/components/analytics/SourceBreakdownChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBrand } from '@/contexts/BrandContext';
import {
  useAnalyticsDisconnect,
  useAnalyticsStatus,
  useAnalyticsSync,
  useAnalyticsTraffic,
} from '@/hooks/useAnalytics';
import { Loader2, MoreVertical, RefreshCw, Unlink } from 'lucide-react';
import { useState } from 'react';

export default function AnalyticsPage() {
  const { brand, isLoading: brandLoading } = useBrand();
  const [days, setDays] = useState(30);

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useAnalyticsStatus(brand?.id || '');
  const {
    data: traffic,
    isLoading: trafficLoading,
    refetch: refetchTraffic,
  } = useAnalyticsTraffic(brand?.id || '', days);
  const { sync, isLoading: syncing } = useAnalyticsSync(brand?.id || '');
  const { disconnect, isLoading: disconnecting } = useAnalyticsDisconnect(brand?.id || '');

  const handleSync = async () => {
    await sync();
    await refetchTraffic();
    await refetchStatus();
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Google Analytics?')) {
      const success = await disconnect();
      if (success) {
        await refetchStatus();
      }
    }
  };

  if (brandLoading || statusLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!brand) {
    return <div>Brand not found</div>;
  }

  if (!status?.connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & ROI</h1>
          <p className="text-muted-foreground">
            Connect Google Analytics to track AI-driven traffic and conversions
          </p>
        </div>
        <ConnectGA4Card brandId={brand.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & ROI</h1>
          <p className="text-muted-foreground">
            Traffic and conversions from AI sources (Last {days} days)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Sync</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive"
              >
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect GA4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {status.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last synced: {new Date(status.lastSyncAt).toLocaleString()}
        </p>
      )}

      <AnalyticsKPICards totals={traffic?.totals || null} isLoading={trafficLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AITrafficChart data={traffic?.trends} isLoading={trafficLoading} />
        <SourceBreakdownChart data={traffic?.bySource} isLoading={trafficLoading} />
      </div>

      {traffic?.bySource && traffic.bySource.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Source Details</CardTitle>
            <CardDescription>Detailed metrics by AI source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Source</th>
                    <th className="pb-2 text-right font-medium">Sessions</th>
                    <th className="pb-2 text-right font-medium">Users</th>
                    <th className="pb-2 text-right font-medium">Conversions</th>
                    <th className="pb-2 text-right font-medium">Conv. Rate</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.bySource
                    .sort((a, b) => b.sessions - a.sessions)
                    .map((source) => (
                      <tr key={source.source} className="border-b last:border-0">
                        <td className="py-3 font-medium">{source.displayName}</td>
                        <td className="py-3 text-right">{source.sessions.toLocaleString()}</td>
                        <td className="py-3 text-right">{source.users.toLocaleString()}</td>
                        <td className="py-3 text-right">{source.conversions.toLocaleString()}</td>
                        <td className="py-3 text-right">{source.conversionRate.toFixed(1)}%</td>
                        <td className="py-3 text-right">
                          {source.revenue.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
