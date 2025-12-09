'use client';

import { ContentGenerator } from '@/components/actions/ContentGenerator';
import { PageAnalyzer } from '@/components/actions/PageAnalyzer';
import { RecommendationsPanel } from '@/components/actions/RecommendationsPanel';
import { SimulationEditor } from '@/components/actions/SimulationEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrand } from '@/contexts/BrandContext';
import { useSearchParams } from 'next/navigation';

export default function ActionsPage() {
  const { brand, isLoading: brandLoading } = useBrand();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'recommendations';

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

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analyze">Analyze Page</TabsTrigger>
          <TabsTrigger value="simulate">Simulate</TabsTrigger>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-4">
          <RecommendationsPanel brandId={brand.id} />
        </TabsContent>

        <TabsContent value="analyze" className="mt-4">
          <PageAnalyzer brandId={brand.id} />
        </TabsContent>

        <TabsContent value="simulate" className="mt-4">
          <SimulationEditor brandId={brand.id} />
        </TabsContent>

        <TabsContent value="generate" className="mt-4">
          <ContentGenerator brandId={brand.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
