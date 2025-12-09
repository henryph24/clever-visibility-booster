'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface CompetitorData {
  name: string;
  mentions: number;
  visibilityPct: number;
  isYourBrand?: boolean;
}

interface CompetitorMentionsChartProps {
  data: CompetitorData[];
  isLoading?: boolean;
}

export function CompetitorMentionsChart({ data, isLoading }: CompetitorMentionsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Mentions Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Add competitors to compare mentions.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => (value.length > 15 ? `${value.slice(0, 15)}...` : value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number, name: string, props) => {
                  const item = props.payload as CompetitorData;
                  return [`${value} mentions (${item.visibilityPct}%)`, 'Mentions'];
                }}
              />
              <Bar dataKey="mentions" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isYourBrand ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
