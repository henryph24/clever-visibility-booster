import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { generatePrompts, getSeedPrompts } from '@/lib/generators';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, topicId } = await params;
    const { useSeed = false } = await req.json();

    const brand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
      include: { competitors: true },
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

    let promptTexts: string[];

    if (useSeed) {
      promptTexts = getSeedPrompts(topic.name);
    } else {
      const competitorNames = brand.competitors.map((c) => c.name);
      promptTexts = await generatePrompts(topic.name, brand.name, competitorNames, 10);
    }

    if (promptTexts.length === 0) {
      return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
    }

    const prompts = await Promise.all(
      promptTexts.map((text) =>
        prisma.prompt.create({
          data: {
            text,
            topicId,
          },
        })
      )
    );

    return NextResponse.json(prompts, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to generate prompts:', error);
    return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
  }
}
