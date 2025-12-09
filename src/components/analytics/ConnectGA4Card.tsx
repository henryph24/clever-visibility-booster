'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsConnect } from '@/hooks/useAnalytics';
import { BarChart3, ExternalLink, Loader2 } from 'lucide-react';

interface ConnectGA4CardProps {
  brandId: string;
}

export function ConnectGA4Card({ brandId }: ConnectGA4CardProps) {
  const { connect, isLoading, error } = useAnalyticsConnect(brandId);

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Connect Google Analytics</CardTitle>
        <CardDescription>
          Track traffic and conversions from AI sources like ChatGPT, Claude, and Perplexity
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            See how many users visit from AI recommendations
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Track conversions attributed to AI visibility
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Measure ROI of your AI optimization efforts
          </li>
        </ul>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={connect} disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Connect GA4
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center max-w-sm">
          We only request read-only access to your analytics data. Your data is never shared.
        </p>
      </CardContent>
    </Card>
  );
}
