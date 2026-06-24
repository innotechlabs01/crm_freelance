import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variable');
}

const redis = new Redis({ url, token });

export const rateLimitAuthenticated = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: true,
  prefix: 'rl:auth',
});

export const rateLimitWrite = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'rl:write',
});

export const rateLimitStripe = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'rl:stripe',
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
  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new RateLimitError(retryAfter);
  }
  return handler();
}
