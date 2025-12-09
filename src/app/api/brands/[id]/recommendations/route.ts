import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { recommendationGenerator } from '@/lib/services/recommendationGenerator';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const type = searchParams.get('type');

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = { brandId: id };
    if (status !== 'all') {
      where.status = status;
    }
    if (type) {
      where.type = type.toUpperCase();
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      orderBy: [
        { priority: 'asc' }, // HIGH comes first alphabetically
        { createdAt: 'desc' },
      ],
    });

    // Transform to frontend format
    const formatted = recommendations.map((rec) => ({
      id: rec.id,
      type: rec.type.toLowerCase(),
      priority: rec.priority.toLowerCase(),
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      action: {
        type: rec.actionType,
        label: rec.actionLabel,
        data: rec.actionData,
      },
      status: rec.status.toLowerCase(),
      createdAt: rec.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Generate new recommendations
    const recommendations = await recommendationGenerator.generate(id);

    // Save them
    await recommendationGenerator.saveRecommendations(id, recommendations);

    // Return the new recommendations
    const saved = await prisma.recommendation.findMany({
      where: { brandId: id, status: 'PENDING' },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    const formatted = saved.map((rec) => ({
      id: rec.id,
      type: rec.type.toLowerCase(),
      priority: rec.priority.toLowerCase(),
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      action: {
        type: rec.actionType,
        label: rec.actionLabel,
        data: rec.actionData,
      },
      status: rec.status.toLowerCase(),
      createdAt: rec.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { recommendationId, status } = await req.json();

    if (!recommendationId || !status) {
      return NextResponse.json(
        { error: 'recommendationId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'DONE', 'DISMISSED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const updated = await prisma.recommendation.update({
      where: { id: recommendationId, brandId: id },
      data: { status: status.toUpperCase() as 'PENDING' | 'DONE' | 'DISMISSED' },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status.toLowerCase(),
    });
  } catch (error) {
    console.error('Failed to update recommendation:', error);
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
  }
}
