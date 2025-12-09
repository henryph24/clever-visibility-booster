'use client';

import { AddTopicDialog } from '@/components/prompts/AddTopicDialog';
import { GenerateTopicsButton } from '@/components/prompts/GenerateTopicsButton';
import { TopicAccordion } from '@/components/prompts/TopicAccordion';
import { useBrand } from '@/contexts/BrandContext';
import { useCallback, useState } from 'react';

export default function PromptsPage() {
  const { brand, isLoading: brandLoading } = useBrand();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prompts</h1>
          <p className="text-muted-foreground">
            Manage topics and prompts for AI visibility tracking
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateTopicsButton brandId={brand.id} onSuccess={handleRefresh} />
          <AddTopicDialog brandId={brand.id} onSuccess={handleRefresh} />
        </div>
      </div>

      <TopicAccordion key={refreshKey} brandId={brand.id} onAddTopic={handleRefresh} />
    </div>
  );
}
