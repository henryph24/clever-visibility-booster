import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { contentGenerator, ContentType } from '@/lib/services/contentGenerator';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { topicId, contentType, referenceUrls, additionalContext } = await req.json();

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
      include: { competitors: true },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const topic = topicId ? await prisma.topic.findUnique({ where: { id: topicId } }) : null;

    if (topicId && !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Fetch reference content if URLs provided
    let referenceContent: string[] = [];
    if (referenceUrls?.length) {
      referenceContent = await contentGenerator.fetchReferenceContent(referenceUrls);
    }

    const result = await contentGenerator.generate({
      brandName: brand.name,
      brandDomain: brand.domain,
      topic: topic?.name || 'general',
      contentType: contentType as ContentType,
      referenceContent: referenceContent.length > 0 ? referenceContent : undefined,
      additionalContext,
      competitors: brand.competitors.map((c) => c.name),
    });

    // Save generated content
    const saved = await prisma.generatedContent.create({
      data: {
        brandId: id,
        topicId: topic?.id,
        contentType: contentType.toUpperCase() as
          | 'BLOG'
          | 'LANDING'
          | 'COMPARISON'
          | 'FAQ'
          | 'GUIDE',
        content: result.content,
        referenceUrls: referenceUrls || [],
      },
    });

    return NextResponse.json({
      id: saved.id,
      content: result.content,
      wordCount: result.wordCount,
    });
  } catch (error) {
    console.error('Failed to generate content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
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

    const history = await prisma.generatedContent.findMany({
      where: { brandId: id },
      include: { topic: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch generated content:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
