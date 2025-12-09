import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: brandId } = await params;
    const { propertyId } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get temp credentials from cookie
    const cookieStore = await cookies();
    const tempCredsCookie = cookieStore.get('ga4_temp_credentials');

    if (!tempCredsCookie) {
      return NextResponse.json(
        { error: 'No pending OAuth flow. Please initiate connection first.' },
        { status: 400 }
      );
    }

    const tempCreds = JSON.parse(tempCredsCookie.value);

    if (tempCreds.brandId !== brandId) {
      return NextResponse.json({ error: 'Brand ID mismatch' }, { status: 400 });
    }

    // Save the analytics connection
    await prisma.analyticsConnection.create({
      data: {
        brandId,
        provider: 'GA4',
        propertyId,
        accessToken: tempCreds.accessToken,
        refreshToken: tempCreds.refreshToken,
        expiresAt: new Date(tempCreds.expiresAt),
      },
    });

    // Clear the temp credentials cookie
    cookieStore.delete('ga4_temp_credentials');

    // Trigger initial sync
    try {
      await ga4Service.syncTrafficData(brandId);
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
      // Don't fail the request, just log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to finalize analytics connection:', error);
    return NextResponse.json({ error: 'Failed to finalize connection' }, { status: 500 });
  }
}
