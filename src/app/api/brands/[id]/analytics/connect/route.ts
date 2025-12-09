import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: brandId } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Check if already connected
    const existingConnection = await prisma.analyticsConnection.findUnique({
      where: { brandId },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Analytics already connected. Disconnect first to reconnect.' },
        { status: 400 }
      );
    }

    // Generate OAuth URL
    const authUrl = ga4Service.getAuthUrl(brandId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to initiate analytics connection:', error);
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 });
  }
}
