import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { contentSimulator } from '@/lib/services/contentSimulator';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { originalContent, modifiedContent, promptIds, providers } = await req.json();

    if (!originalContent || !modifiedContent || !promptIds?.length) {
      return NextResponse.json(
        { error: 'originalContent, modifiedContent, and promptIds are required' },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Fetch prompts
    const prompts = await prisma.prompt.findMany({
      where: {
        id: { in: promptIds },
        topic: { brandId: id },
      },
    });

    if (prompts.length === 0) {
      return NextResponse.json({ error: 'No valid prompts found' }, { status: 404 });
    }

    const results = await contentSimulator.simulate({
      brandName: brand.name,
      originalContent,
      modifiedContent,
      prompts: prompts.map((p) => ({ id: p.id, text: p.text })),
      providers,
    });

    // Save simulation result
    const saved = await prisma.simulationResult.create({
      data: {
        brandId: id,
        originalContent,
        modifiedContent,
        promptIds,
        results: JSON.parse(JSON.stringify(results.prompts)),
        summary: results.summary,
      },
    });

    return NextResponse.json({
      id: saved.id,
      ...results,
    });
  } catch (error) {
    console.error('Failed to run simulation:', error);
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const history = await prisma.simulationResult.findMany({
      where: { brandId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        summary: true,
        createdAt: true,
        promptIds: true,
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch simulation history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
