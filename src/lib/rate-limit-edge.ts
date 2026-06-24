import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
}

const redisEdge = new Redis({ url, token });

export const rateLimitPublic = new Ratelimit({
  redis: redisEdge,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: 'rl:edge',
});

export const rateLimitSignIn = new Ratelimit({
  redis: redisEdge,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'rl:signin',
});

export const rateLimitSignUp = new Ratelimit({
  redis: redisEdge,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: 'rl:signup',
});
