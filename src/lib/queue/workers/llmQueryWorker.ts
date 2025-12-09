import { Job, Worker } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '@/lib/supabase/admin';
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

      const { data: prompts } = await supabaseAdmin.from('prompts').select('*').in('id', promptIds);

      const { data: brand } = await supabaseAdmin
        .from('brands')
        .select('*, competitors (*)')
        .eq('id', brandId)
        .single();

      if (!brand) {
        throw new Error('Brand not found');
      }

      const parser = createParser(
        [brand.name],
        (brand.competitors || []).map((c: { name: string }) => c.name)
      );

      let processedCount = 0;
      const totalOperations = (prompts?.length || 0) * providers.length;

      for (const prompt of prompts || []) {
        for (const provider of providers) {
          try {
            const client = createLLMClient(provider);
            const result = await client.query(prompt.text);
            const parsed = parser.parse(result.response, result.citations);

            const { data: response, error: responseError } = await supabaseAdmin
              .from('llm_responses')
              .insert({
                prompt_id: prompt.id,
                provider,
                response_text: result.response,
              })
              .select()
              .single();

            if (responseError || !response) {
              console.error('Failed to create response:', responseError);
              continue;
            }

            for (const mention of parsed.mentions) {
              const competitor = (brand.competitors || []).find(
                (c: { name: string }) => c.name.toLowerCase() === mention.brandName.toLowerCase()
              );

              await supabaseAdmin.from('brand_mentions').insert({
                response_id: response.id,
                brand_id:
                  mention.brandName.toLowerCase() === brand.name.toLowerCase() ? brandId : null,
                competitor_id: competitor?.id || null,
                brand_name: mention.brandName,
                rank_position: mention.rankPosition,
                is_cited: mention.isCited,
                context: mention.context,
              });
            }

            for (const source of parsed.sources) {
              await supabaseAdmin.from('cited_sources').insert({
                response_id: response.id,
                url: source.url,
                domain: source.domain,
                title: source.title,
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
