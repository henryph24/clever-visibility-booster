import { Queue } from 'bullmq';
import Redis from 'ioredis';

const getRedisConnection = () => {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, queue operations will fail');
    return null;
  }
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
};

const connection = getRedisConnection();

export const llmQueryQueue = connection ? new Queue('llm-queries', { connection }) : null;

export const metricsQueue = connection ? new Queue('metrics-aggregation', { connection }) : null;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
