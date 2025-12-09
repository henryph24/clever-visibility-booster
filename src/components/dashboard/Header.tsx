'use client';

import { useBrand } from '@/contexts/BrandContext';
import { UserButton } from '../auth/UserButton';
import { BrandSelector } from './BrandSelector';

export function Header() {
  const { brand, isLoading } = useBrand();

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <div className="hidden lg:block" />
        {isLoading ? (
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        ) : brand ? (
          <BrandSelector currentBrand={brand} />
        ) : null}
      </div>
      <UserButton />
    </header>
  );
}
