import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ promptId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptId } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        topic: {
          include: { brand: true },
        },
      },
    });

    if (!prompt || prompt.topic.brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const responses = await prisma.lLMResponse.findMany({
      where: { promptId },
      include: {
        mentions: true,
        sources: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = responses.map((response) => ({
      id: response.id,
      provider: response.provider,
      responseText: response.responseText,
      mentions: response.mentions.map((m) => ({
        brandName: m.brandName,
        rankPosition: m.rankPosition,
        isCited: m.isCited,
        context: m.context,
      })),
      sources: response.sources.map((s) => ({
        url: s.url,
        domain: s.domain,
        title: s.title,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
