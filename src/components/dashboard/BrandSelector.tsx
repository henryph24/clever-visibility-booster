'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Brand {
  id: string;
  name: string;
  domain: string;
}

interface BrandSelectorProps {
  currentBrand: Brand;
}

export function BrandSelector({ currentBrand }: BrandSelectorProps) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => setBrands(data))
      .catch(console.error);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <div className="text-left">
            <div className="font-semibold">{currentBrand.name}</div>
            <div className="text-xs text-muted-foreground">{currentBrand.domain}</div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {brands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => router.push(`/dashboard/${brand.id}`)}
            className={brand.id === currentBrand.id ? 'bg-muted' : ''}
          >
            <div>
              <div className="font-medium">{brand.name}</div>
              <div className="text-xs text-muted-foreground">{brand.domain}</div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
