# Rate Limiting & Security Hardening — Design Spec

**Date:** 2026-06-23
**Status:** Approved
**Author:** opencode

---

## 1. Problem Statement

The CRM application has **zero rate limiting** and several critical security gaps:

- `/api/seed` and `/api/migrate` endpoints are completely unprotected — anyone can seed the database or run migrations
- No per-user or per-IP request throttling exists
- Server actions and API routes have no abuse protection
- The application is deployed on Vercel and will be used by many users

**Goal:** Implement hybrid rate limiting (Edge + Application layer) using Upstash Redis, without user locking or database locking. Return HTTP 429 when limits are exceeded.

---

## 2. Architecture

### Two-Layer Hybrid Approach

```
Request → Edge Middleware (IP rate limit) → Server → API Routes / Server Actions (userId rate limit)
              ↓                                    ↓
         Exceeds? → 429                   Exceeds? → 429
         OK? → continues                 OK? → executes
```

**Layer 1 — Edge Middleware (Public Routes):**
- Rate limiting by IP address
- Protects: landing page, sign-in, sign-up, Stripe webhook
- Blocks: `/api/seed` and `/api/migrate` completely

**Layer 2 — Application Wrappers (Authenticated Routes):**
- Rate limiting by Clerk userId
- Protects: server actions, API routes requiring auth
- Granular limits per endpoint type

### Technology Stack

- **`@upstash/ratelimit`** — Sliding window rate limiter for Upstash Redis
- **`@upstash/redis`** — Serverless Redis client (Vercel-native)
- **Existing `src/proxy.ts`** — Edge middleware for Layer 1

---

## 3. Rate Limit Configuration

### Layer 1 — Edge (IP-based)

| Route | Limit | Window | Action |
|---|---|---|---|
| `/` (landing) | 100 req | 60s | HTTP 429 |
| `/sign-in/*` | 5 req | 60s | HTTP 429 |
| `/sign-up/*` | 10 req | 60s | HTTP 429 |
| `/api/stripe/webhook` | 30 req | 60s | HTTP 429 |
| `/api/seed` | 0 req | — | HTTP 403 (blocked) |
| `/api/migrate` | 0 req | — | HTTP 403 (blocked) |
| Other public routes | 100 req | 60s | HTTP 429 |

### Layer 2 — Application (userId-based)

| Endpoint Type | Limit | Window | Applied To |
|---|---|---|---|
| Server Actions (CRUD) | 30 req | 60s | `createClient`, `createInvoice`, `updateClient`, etc. |
| `/api/auth/me` | 60 req | 60s | User info endpoint |
| `/api/stripe/checkout` | 5 req | 60s | Stripe checkout |
| `/api/stripe/portal` | 10 req | 60s | Stripe portal |
| Admin actions | 60 req | 60s | `getAdminUsers`, `getAdminTickets`, etc. |

---

## 4. Files to Create/Modify

### New Files

| File | Purpose |
|---|---|
| `src/lib/rate-limit.ts` | Rate limiter configuration and `withRateLimit()` wrapper |
| `src/lib/rate-limit-edge.ts` | Edge-compatible rate limiter for middleware |

### Modified Files

| File | Changes |
|---|---|
| `src/proxy.ts` | Add Edge rate limiting, block `/api/seed` and `/api/migrate` |
| `src/app/actions/invoices.ts` | Wrap mutations with `withRateLimit()` |
| `src/app/actions/clients.ts` | Wrap mutations with `withRateLimit()` |
| `src/app/actions/freelancer.ts` | Wrap mutations with `withRateLimit()` |
| `src/app/actions/admin.ts` | Wrap actions with `withRateLimit()` |
| `src/app/api/auth/me/route.ts` | Add rate limiting |
| `src/app/api/stripe/checkout/route.ts` | Add rate limiting |
| `src/app/api/stripe/portal/route.ts` | Add rate limiting |
| `src/components/auth/auth-provider.tsx` | Handle 429 errors with user-friendly toast |
| `next.config.ts` | Add Content-Security-Policy header |
| `.env.example` | Add Upstash env vars |

---

## 5. Rate Limiter Implementation

### `src/lib/rate-limit.ts` (Application Layer)

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Shared limiter for authenticated routes
export const rateLimitAuthenticated = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: true,
  prefix: 'rl:auth',
});

// Specific limiter for write operations (stricter)
export const rateLimitWrite = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'rl:write',
});

// Login limiter (very strict)
export const rateLimitLogin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'rl:login',
});

export class RateLimitError extends Error {
  retryAfter: number;
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
```

### `src/lib/rate-limit-edge.ts` (Edge Layer)

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Edge-compatible Redis client (no Node.js APIs)
export const redisEdge = new Redis({
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
```

---

## 6. Response Format

### HTTP 429 Response

```json
{
  "error": "Demasiadas solicitudes. Intenta de nuevo en 45 segundos.",
  "retryAfter": 45
}
```

### Headers

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698765432
Content-Type: application/json
```

### Frontend Handling

In `auth-provider.tsx`, when a 429 is received:
- Show toast: "Límite de solicitudes alcanzado. Espera un momento."
- Do NOT retry automatically
- The user can retry manually after the wait period

---

## 7. Security Fixes (Bonus)

### Block Sensitive Endpoints

In `src/proxy.ts`, add `/api/seed` and `/api/migrate` to a blocklist:

```ts
const blockedRoutes = ['/api/seed', '/api/migrate'];
if (blockedRoutes.some(r => url.pathname.startsWith(r))) {
  return new Response('Forbidden', { status: 403 });
}
```

### Content-Security-Policy

Add CSP header in `next.config.ts`:

```ts
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.accounts.dev *.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.clerk.accounts.dev; font-src 'self'; connect-src 'self' *.clerk.accounts.dev *.stripe.com *.upstash.io;"
}
```

---

## 8. Environment Variables

Add to `.env.example`:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

---

## 9. Testing Strategy

1. **Unit test:** Verify `withRateLimit()` throws `RateLimitError` when limit exceeded
2. **Integration test:** Verify Edge middleware returns 429 for `/api/seed`
3. **E2E test:** Verify sign-in page shows 429 toast after 5 rapid attempts
4. **Manual test:** Use `curl` to send 101 requests to landing page and verify 429

---

## 10. Deployment Steps

1. Create Upstash Redis database (Redis REST API, not Memcached)
2. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel env vars
3. Install `@upstash/ratelimit` and `@upstash/redis`
4. Deploy and verify rate limiting works
5. Monitor Upstash dashboard for analytics

---

## 11. Cost Estimate

Upstash pricing (pay-per-request):
- **Free tier:** 10,000 commands/day
- **Pro:** $0.2 per 10,000 commands
- For a CRM with 100 daily users making ~500 requests each = 50,000 commands/day = ~$1/day

---

## 12. Non-Goals

- No user locking or account suspension
- No database-level locking
- No IP blocklist management UI (future enhancement)
- No CAPTCHA integration
- No DDoS mitigation (handled by Vercel/Cloudflare at infrastructure level)
