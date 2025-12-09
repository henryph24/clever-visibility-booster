import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pageAnalyzer } from '@/lib/services/pageAnalyzer';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { url, content, topicId } = await req.json();

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const topic = topicId ? await prisma.topic.findUnique({ where: { id: topicId } }) : null;

    const analysis = await pageAnalyzer.analyze({
      url,
      content,
      brandName: brand.name,
      topicContext: topic?.name,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Failed to analyze page:', error);
    return NextResponse.json({ error: 'Failed to analyze page' }, { status: 500 });
  }
}
