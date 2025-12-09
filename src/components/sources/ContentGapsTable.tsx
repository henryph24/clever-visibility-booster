'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useContentGaps } from '@/hooks/useSources';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface ContentGapsTableProps {
  brandId: string;
}

export function ContentGapsTable({ brandId }: ContentGapsTableProps) {
  const { data: gaps, isLoading } = useContentGaps(brandId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No content gaps found</h3>
        <p className="mt-2 text-muted-foreground">
          Great news! All sources that mention competitors also mention your brand.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">Content Gaps Detected</h4>
            <p className="text-sm text-yellow-700">
              These sources mention your competitors but not your brand. Consider reaching out for
              inclusion.
            </p>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Competitors Mentioned</TableHead>
            <TableHead className="max-w-xs">Related Prompt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gaps.map((gap, i) => (
            <TableRow key={i}>
              <TableCell>
                <a
                  href={gap.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {gap.domain}
                </a>
                {gap.title && (
                  <p className="mt-1 max-w-xs truncate text-sm text-muted-foreground">
                    {gap.title}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {gap.mentionedCompetitors.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="line-clamp-2 text-sm text-muted-foreground">{gap.prompt}</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
