import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { ga4Service } from '@/lib/analytics/ga4';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: brandId } = await params;

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

    // List available GA4 properties
    const properties = await ga4Service.listProperties(tempCreds.accessToken);

    return NextResponse.json({ properties });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to list properties:', error);
    return NextResponse.json({ error: 'Failed to list properties' }, { status: 500 });
  }
}
