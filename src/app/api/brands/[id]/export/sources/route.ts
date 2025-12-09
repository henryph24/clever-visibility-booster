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

    const sources = await prisma.citedSource.findMany({
      where: {
        response: { prompt: { topic: { brandId: id } } },
      },
      include: {
        response: {
          include: {
            mentions: true,
          },
        },
      },
    });

    const domainStats = new Map<
      string,
      {
        domain: string;
        totalCitations: number;
        uniqueUrls: Set<string>;
        mentionsYourBrand: number;
        mentionsCompetitors: number;
      }
    >();

    for (const source of sources) {
      const existing = domainStats.get(source.domain) || {
        domain: source.domain,
        totalCitations: 0,
        uniqueUrls: new Set<string>(),
        mentionsYourBrand: 0,
        mentionsCompetitors: 0,
      };

      existing.totalCitations++;
      existing.uniqueUrls.add(source.url);

      if (source.response.mentions.some((m) => m.brandId === id)) {
        existing.mentionsYourBrand++;
      }
      if (source.response.mentions.some((m) => m.competitorId !== null)) {
        existing.mentionsCompetitors++;
      }

      domainStats.set(source.domain, existing);
    }

    const data = Array.from(domainStats.values()).map((d) => ({
      domain: d.domain,
      totalCitations: d.totalCitations,
      uniqueUrls: d.uniqueUrls.size,
      mentionsYourBrand: d.mentionsYourBrand,
      mentionsCompetitors: d.mentionsCompetitors,
    }));

    const csv = generateCSV(data, [
      { key: 'domain', header: 'Domain' },
      { key: 'totalCitations', header: 'Total Citations' },
      { key: 'uniqueUrls', header: 'Unique URLs' },
      { key: 'mentionsYourBrand', header: 'Mentions Your Brand' },
      { key: 'mentionsCompetitors', header: 'Mentions Competitors' },
    ]);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sources-${brand.name}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return new Response('Export failed', { status: 500 });
  }
}
