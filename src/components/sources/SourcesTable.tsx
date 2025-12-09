'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSources } from '@/hooks/useSources';
import { ExternalLink, Globe } from 'lucide-react';
import { useState } from 'react';

interface SourcesTableProps {
  brandId: string;
}

export function SourcesTable({ brandId }: SourcesTableProps) {
  const { data: sources, isLoading } = useSources(brandId);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No sources yet</h3>
        <p className="mt-2 text-muted-foreground">
          Run visibility scans to discover which sources LLMs cite for your topics.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Domain</TableHead>
          <TableHead className="text-center">Citations</TableHead>
          <TableHead className="text-center">Mentions You</TableHead>
          <TableHead className="text-center">Mentions Competitors</TableHead>
          <TableHead className="w-24"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <>
            <TableRow key={source.domain}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{source.domain}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">{source.totalCitations}</TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={source.mentionsYourBrand > 0 ? 'default' : 'secondary'}
                  className={
                    source.mentionsYourBrand > 0
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : ''
                  }
                >
                  {source.mentionsYourBrand}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{source.mentionsCompetitors}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedDomain(expandedDomain === source.domain ? null : source.domain)
                  }
                >
                  {expandedDomain === source.domain ? 'Hide' : 'View URLs'}
                </Button>
              </TableCell>
            </TableRow>
            {expandedDomain === source.domain && (
              <TableRow>
                <TableCell colSpan={5} className="bg-muted/30">
                  <div className="space-y-1 py-2">
                    {source.urls.map((url, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-1">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {url.title || url.url}
                        </a>
                        <Badge variant="outline">{url.count}x</Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
