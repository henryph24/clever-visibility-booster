import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId } = await params;
    const { searchParams } = new URL(req.url);
    const withResponses = searchParams.get('withResponses') === 'true';

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { brand: true },
    });

    if (!topic || topic.brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (withResponses) {
      const promptsWithResponses = await prisma.prompt.findMany({
        where: { topicId },
        include: {
          responses: {
            include: {
              mentions: {
                where: { brandId: topic.brandId },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const result = promptsWithResponses.map((prompt) => ({
        id: prompt.id,
        text: prompt.text,
        responses: prompt.responses.map((response) => ({
          id: response.id,
          provider: response.provider,
          hasMention: response.mentions.length > 0,
          rank: response.mentions[0]?.rankPosition || null,
        })),
      }));
      return NextResponse.json(result);
    }

    const prompts = await prisma.prompt.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}
