import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCSV } from '@/lib/export/csv';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!brand) {
      return new Response('Brand not found', { status: 404 });
    }

    const prompts = await prisma.prompt.findMany({
      where: { topic: { brandId: id } },
      include: {
        topic: true,
        responses: {
          include: {
            mentions: true,
            sources: true,
          },
        },
      },
    });

    const flatData: {
      topic: string;
      prompt: string;
      provider: string;
      mentioned: boolean;
      rank: number | null;
      citedSources: string;
      responseDate: Date;
    }[] = [];

    for (const prompt of prompts) {
      if (prompt.responses.length === 0) {
        flatData.push({
          topic: prompt.topic.name,
          prompt: prompt.text,
          provider: 'N/A',
          mentioned: false,
          rank: null,
          citedSources: '',
          responseDate: prompt.createdAt,
        });
      } else {
        for (const response of prompt.responses) {
          const brandMention = response.mentions.find(
            (m) => m.brandName.toLowerCase() === brand.name.toLowerCase()
          );
          flatData.push({
            topic: prompt.topic.name,
            prompt: prompt.text,
            provider: response.provider,
            mentioned: !!brandMention,
            rank: brandMention?.rankPosition || null,
            citedSources: response.sources.map((s) => s.domain).join('; '),
            responseDate: response.createdAt,
          });
        }
      }
    }

    const csv = generateCSV(flatData, [
      { key: 'topic', header: 'Topic' },
      { key: 'prompt', header: 'Prompt' },
      { key: 'provider', header: 'LLM Provider' },
      { key: 'mentioned', header: 'Brand Mentioned' },
      { key: 'rank', header: 'Rank Position' },
      { key: 'citedSources', header: 'Cited Sources' },
      { key: 'responseDate', header: 'Response Date' },
    ]);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="prompts-${brand.name}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return new Response('Export failed', { status: 500 });
  }
}
