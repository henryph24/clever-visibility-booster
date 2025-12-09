import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
      include: {
        competitors: true,
        topics: { include: { prompts: true } },
        metrics: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch brand:', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const updates = await req.json();

    const existingBrand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: updates.name,
        domain: updates.domain,
        industry: updates.industry,
      },
      include: { competitors: true },
    });

    return NextResponse.json(brand);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to update brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existingBrand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    await prisma.brand.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to delete brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
