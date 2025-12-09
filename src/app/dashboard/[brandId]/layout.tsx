'use client';

import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BrandProvider } from '@/contexts/BrandContext';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

export default function BrandDashboardLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const brandId = params.brandId as string;

  return (
    <BrandProvider brandId={brandId}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col lg:pl-0">
          <Header />
          <main className="flex-1 overflow-auto p-4 pt-16 lg:p-6 lg:pt-6">{children}</main>
        </div>
      </div>
    </BrandProvider>
  );
}
