import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id, userId: session.user.id },
      include: { competitors: true },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get all cited sources for this brand's prompts
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

    // Group by domain
    const domainStats = new Map<
      string,
      {
        domain: string;
        totalCitations: number;
        mentionsYourBrand: number;
        mentionsCompetitors: number;
        urls: { url: string; title: string | null; count: number }[];
      }
    >();

    for (const source of sources) {
      const existing = domainStats.get(source.domain) || {
        domain: source.domain,
        totalCitations: 0,
        mentionsYourBrand: 0,
        mentionsCompetitors: 0,
        urls: [],
      };

      existing.totalCitations++;

      // Check if response mentions your brand
      if (source.response.mentions.some((m) => m.brandId === id)) {
        existing.mentionsYourBrand++;
      }

      // Check if response mentions competitors
      if (source.response.mentions.some((m) => m.competitorId !== null)) {
        existing.mentionsCompetitors++;
      }

      // Track URL occurrences
      const urlEntry = existing.urls.find((u) => u.url === source.url);
      if (urlEntry) {
        urlEntry.count++;
      } else {
        existing.urls.push({ url: source.url, title: source.title, count: 1 });
      }

      domainStats.set(source.domain, existing);
    }

    const result = Array.from(domainStats.values())
      .sort((a, b) => b.totalCitations - a.totalCitations)
      .map((d) => ({
        ...d,
        urls: d.urls.sort((a, b) => b.count - a.count).slice(0, 5),
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}
