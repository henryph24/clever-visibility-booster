'use client';

import { BrandCard } from './BrandCard';
import { CreateBrandDialog } from './CreateBrandDialog';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Brand {
  id: string;
  name: string;
  domain: string;
  industry: string | null;
  competitors: { id: string; name: string }[];
  _count?: { topics: number; metrics: number };
}

export function BrandList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBrands(brands.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete brand:', error);
    }
  };

  const handleCreate = () => {
    setDialogOpen(false);
    fetchBrands();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} onDelete={handleDelete} />
        ))}
        <button
          onClick={() => setDialogOpen(true)}
          className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8" />
            <span>Add Brand</span>
          </div>
        </button>
      </div>
      <CreateBrandDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleCreate} />
    </div>
  );
}
