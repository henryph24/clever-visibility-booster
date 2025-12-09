import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { llmQueryQueue } from '@/lib/queue';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const brand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const prompts = await prisma.prompt.findMany({
      where: { topic: { brandId: id } },
      select: { id: true },
    });

    if (prompts.length === 0) {
      return NextResponse.json(
        { error: 'No prompts configured. Add topics and prompts first.' },
        { status: 400 }
      );
    }

    if (!llmQueryQueue) {
      return NextResponse.json(
        { error: 'Queue system not configured. Please set REDIS_URL.' },
        { status: 503 }
      );
    }

    // Use web-search-enabled providers for accurate AI visibility tracking
    // OpenAI (Responses API), Anthropic (web_search tool), Perplexity (native search)
    const job = await llmQueryQueue.add('scan-brand', {
      brandId: id,
      promptIds: prompts.map((p) => p.id),
      providers: ['OPENAI', 'ANTHROPIC', 'PERPLEXITY'],
    });

    return NextResponse.json({
      jobId: job.id,
      promptCount: prompts.length,
      message: 'Scan started',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to start scan:', error);
    return NextResponse.json({ error: 'Failed to start scan' }, { status: 500 });
  }
}
