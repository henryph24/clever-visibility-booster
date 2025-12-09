'use client';

import { PageAnalyzer } from '@/components/actions/PageAnalyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrand } from '@/contexts/BrandContext';

export default function ActionsPage() {
  const { brand, isLoading: brandLoading } = useBrand();

  if (brandLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!brand) {
    return <div>Brand not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Actions</h1>
        <p className="text-muted-foreground">Tools to improve your AI visibility</p>
      </div>

      <Tabs defaultValue="analyze">
        <TabsList>
          <TabsTrigger value="analyze">Analyze Page</TabsTrigger>
          <TabsTrigger value="simulate" disabled>
            Simulate (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="generate" disabled>
            Generate Content (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="mt-4">
          <PageAnalyzer brandId={brand.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
