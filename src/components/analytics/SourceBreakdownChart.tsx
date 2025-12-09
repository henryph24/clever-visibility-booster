'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrafficSource {
  source: string;
  displayName: string;
  sessions: number;
  users: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface SourceBreakdownChartProps {
  data: TrafficSource[] | undefined;
  isLoading: boolean;
}

export function SourceBreakdownChart({ data, isLoading }: SourceBreakdownChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic by AI Source</CardTitle>
          <CardDescription>Sessions breakdown by AI platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic by AI Source</CardTitle>
          <CardDescription>Sessions breakdown by AI platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No source data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.sessions - a.sessions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic by AI Source</CardTitle>
        <CardDescription>Sessions breakdown by AI platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'sessions') return [value.toLocaleString(), 'Sessions'];
                if (name === 'conversions') return [value.toLocaleString(), 'Conversions'];
                return [value, name];
              }}
            />
            <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
