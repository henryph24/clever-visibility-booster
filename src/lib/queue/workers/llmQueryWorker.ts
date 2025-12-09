import { Job, Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@/lib/db';
import { createLLMClient } from '@/lib/llm';
import { createParser } from '@/lib/parsers';
import { delay } from '../index';
import { LLMQueryJobData } from '../types';

export function createLLMQueryWorker() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, LLM query worker not started');
    return null;
  }

  const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker<LLMQueryJobData>(
    'llm-queries',
    async (job: Job<LLMQueryJobData>) => {
      const { brandId, promptIds, providers } = job.data;

      const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } },
      });

      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: { competitors: true },
      });

      if (!brand) {
        throw new Error('Brand not found');
      }

      const parser = createParser(
        [brand.name],
        brand.competitors.map((c) => c.name)
      );

      let processedCount = 0;
      const totalOperations = prompts.length * providers.length;

      for (const prompt of prompts) {
        for (const provider of providers) {
          try {
            const client = createLLMClient(provider);
            const result = await client.query(prompt.text);
            const parsed = parser.parse(result.response, result.citations);

            const response = await prisma.lLMResponse.create({
              data: {
                promptId: prompt.id,
                provider,
                responseText: result.response,
              },
            });

            for (const mention of parsed.mentions) {
              const competitor = brand.competitors.find(
                (c) => c.name.toLowerCase() === mention.brandName.toLowerCase()
              );

              await prisma.brandMention.create({
                data: {
                  responseId: response.id,
                  brandId:
                    mention.brandName.toLowerCase() === brand.name.toLowerCase() ? brandId : null,
                  competitorId: competitor?.id || null,
                  brandName: mention.brandName,
                  rankPosition: mention.rankPosition,
                  isCited: mention.isCited,
                  context: mention.context,
                },
              });
            }

            for (const source of parsed.sources) {
              await prisma.citedSource.create({
                data: {
                  responseId: response.id,
                  url: source.url,
                  domain: source.domain,
                  title: source.title,
                },
              });
            }

            await delay(1000);
          } catch (error) {
            console.error(`Failed: ${prompt.id} - ${provider}`, error);
          }

          processedCount++;
          await job.updateProgress(Math.round((processedCount / totalOperations) * 100));
        }
      }

      return { processedCount };
    },
    {
      connection,
      concurrency: 2,
      limiter: { max: 10, duration: 60000 },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}
