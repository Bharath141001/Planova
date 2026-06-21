import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.warn(`Redis error: ${err.message}`));
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  try {
    await getRedis().connect();
  } catch (err) {
    logger.warn(`Redis unavailable, continuing without cache: ${(err as Error).message}`);
  }
}

/**
 * Safe cache wrapper. Returns cached value if present, otherwise runs the
 * resolver, caches the result, and returns it. Falls back to the resolver if
 * Redis is unavailable so the app keeps working without a cache.
 */
export async function cacheable<T>(
  key: string,
  ttlSeconds: number,
  resolver: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    return resolver();
  }

  const fresh = await resolver();
  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
  return fresh;
}

export async function invalidate(pattern: string): Promise<void> {
  const redis = getRedis();
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    /* ignore */
  }
}
