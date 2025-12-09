import Redis from 'ioredis';

const getRedis = () => {
  if (!process.env.REDIS_URL) {
    return null;
  }
  return new Redis(process.env.REDIS_URL);
};

const redis = getRedis();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!redis) return;
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, data);
      } else {
        await redis.set(key, data);
      }
    } catch {
      console.warn('Cache set failed');
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {
      console.warn('Cache delete failed');
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) {
        await redis.del(...keys);
      }
    } catch {
      console.warn('Cache delete pattern failed');
    }
  },
};

export const cacheKeys = {
  brandMetrics: (brandId: string) => `brand:${brandId}:metrics`,
  brandTrends: (brandId: string, days: number) => `brand:${brandId}:trends:${days}`,
  competitorStats: (brandId: string) => `brand:${brandId}:competitors`,
  topics: (brandId: string) => `brand:${brandId}:topics`,
  prompts: (topicId: string) => `topic:${topicId}:prompts`,
  sources: (brandId: string) => `brand:${brandId}:sources`,
};

export const cacheTTL = {
  metrics: 60 * 5, // 5 minutes
  trends: 60 * 15, // 15 minutes
  competitors: 60 * 10, // 10 minutes
  topics: 60 * 30, // 30 minutes
  sources: 60 * 15, // 15 minutes
};

export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  await cache.set(key, data, ttl);
  return data;
}

export async function invalidateBrandCache(brandId: string): Promise<void> {
  await cache.delPattern(`brand:${brandId}:*`);
}

export async function invalidateTopicCache(topicId: string, brandId: string): Promise<void> {
  await cache.del(cacheKeys.prompts(topicId));
  await cache.del(cacheKeys.topics(brandId));
}
