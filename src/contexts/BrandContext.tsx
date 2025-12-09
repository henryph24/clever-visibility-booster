'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface Brand {
  id: string;
  name: string;
  domain: string;
  industry: string | null;
}

interface BrandContextType {
  brand: Brand | null;
  setBrand: (brand: Brand | null) => void;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children, brandId }: { children: ReactNode; brandId?: string }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(!!brandId);

  useEffect(() => {
    if (brandId) {
      setIsLoading(true);
      fetch(`/api/brands/${brandId}`)
        .then((res) => res.json())
        .then((data) => {
          setBrand(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [brandId]);

  return (
    <BrandContext.Provider value={{ brand, setBrand, isLoading }}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
