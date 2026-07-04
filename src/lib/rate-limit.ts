import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export const rateLimitAuthenticated = new Ratelimit({
  redis: redis ?? new Redis({ url: '', token: '' }),
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: true,
  prefix: 'rl:auth',
});

export const rateLimitWrite = new Ratelimit({
  redis: redis ?? new Redis({ url: '', token: '' }),
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'rl:write',
});

export const rateLimitLemonsqueezy = new Ratelimit({
  redis: redis ?? new Redis({ url: '', token: '' }),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'rl:paddle',
});

export class RateLimitError extends Error {
  retryAfter!: number;
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s.`);
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

export async function withRateLimit<T>(
  identifier: string,
  limiter: Ratelimit,
  handler: () => Promise<T>
): Promise<T> {
  try {
    const { success, reset } = await limiter.limit(identifier);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      throw new RateLimitError(retryAfter);
    }
  } catch (e) {
    if (e instanceof RateLimitError) throw e;
  }
  return handler();
}
