import { BrandList } from '@/components/brands/BrandList';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Brands</h1>
        <p className="text-muted-foreground">Manage your brands and track their AI visibility.</p>
      </div>
      <BrandList />
    </div>
  );
}
