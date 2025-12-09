'use client';

import { AddCompetitorDialog } from '@/components/competitors/AddCompetitorDialog';
import { CompetitorOverviewCards } from '@/components/competitors/CompetitorOverviewCards';
import { useBrand } from '@/contexts/BrandContext';
import { useCallback, useState } from 'react';

export default function CompetitorsPage() {
  const { brand, isLoading: brandLoading } = useBrand();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (brandLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
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
          <h1 className="text-3xl font-bold">Competitors</h1>
          <p className="text-muted-foreground">Compare your AI visibility against competitors</p>
        </div>
        <AddCompetitorDialog brandId={brand.id} onSuccess={handleRefresh} />
      </div>

      <CompetitorOverviewCards key={refreshKey} brandId={brand.id} />
    </div>
  );
}
