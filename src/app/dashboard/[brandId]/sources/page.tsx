'use client';

import { ContentGapsTable } from '@/components/sources/ContentGapsTable';
import { SourcesTable } from '@/components/sources/SourcesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrand } from '@/contexts/BrandContext';

export default function SourcesPage() {
  const { brand, isLoading: brandLoading } = useBrand();

  if (brandLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!brand) {
    return <div>Brand not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sources</h1>
        <p className="text-muted-foreground">
          Discover which sources LLMs cite when discussing your topics
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Sources</TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <SourcesTable brandId={brand.id} />
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <ContentGapsTable brandId={brand.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
