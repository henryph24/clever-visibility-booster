import { BrandSettingsForm } from '@/components/brands/BrandSettingsForm';
import { CompetitorList } from '@/components/brands/CompetitorList';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

interface BrandSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandSettingsPage({ params }: BrandSettingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { id } = await params;

  const { data: brand } = await supabase
    .from('brands')
    .select('*, competitors (*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!brand) {
    notFound();
  }

  // Transform to camelCase for components
  const brandData = {
    id: brand.id,
    name: brand.name,
    domain: brand.domain,
    industry: brand.industry,
    userId: brand.user_id,
    createdAt: brand.created_at,
    updatedAt: brand.updated_at,
    competitors: (brand.competitors || []).map(
      (c: { id: string; name: string; domain: string; brand_id: string; created_at: string }) => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        brandId: c.brand_id,
        createdAt: c.created_at,
      })
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{brand.name} Settings</h1>
        <p className="text-muted-foreground">Manage your brand settings and competitors.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BrandSettingsForm brand={brandData} />
        <CompetitorList brandId={brand.id} competitors={brandData.competitors} />
      </div>
    </div>
  );
}
