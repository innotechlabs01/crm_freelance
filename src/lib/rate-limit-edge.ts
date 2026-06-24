import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisEdge = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
