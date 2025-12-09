import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, topicId } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const prompts = await prisma.prompt.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, topicId } = await params;
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, brandId: id },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const prompt = await prisma.prompt.create({
      data: {
        text,
        topicId,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create prompt:', error);
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}
