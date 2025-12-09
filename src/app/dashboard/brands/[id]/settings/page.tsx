import { BrandSettingsForm } from '@/components/brands/BrandSettingsForm';
import { CompetitorList } from '@/components/brands/CompetitorList';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface BrandSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandSettingsPage({ params }: BrandSettingsPageProps) {
  const user = await requireAuth();
  const { id } = await params;

  const brand = await prisma.brand.findFirst({
    where: { id, userId: user.id },
    include: { competitors: true },
  });

  if (!brand) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{brand.name} Settings</h1>
        <p className="text-muted-foreground">Manage your brand settings and competitors.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BrandSettingsForm brand={brand} />
        <CompetitorList brandId={brand.id} competitors={brand.competitors} />
      </div>
    </div>
  );
}
