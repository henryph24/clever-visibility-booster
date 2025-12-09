import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth();

    const brands = await prisma.brand.findMany({
      where: { userId: user.id },
      include: {
        competitors: true,
        _count: {
          select: { topics: true, metrics: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(brands);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { name, domain, industry } = await req.json();

    if (!name || !domain) {
      return NextResponse.json({ error: 'Name and domain are required' }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        domain,
        industry,
        userId: user.id,
      },
      include: { competitors: true },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
