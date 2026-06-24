# Rate Limiting & Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement hybrid rate limiting (Edge + Application layer) using Upstash Redis, block unprotected endpoints, and add CSP headers.

**Architecture:** Two-layer rate limiting: Edge middleware for IP-based limiting on public routes, application wrappers for userId-based limiting on authenticated routes. Upstash Redis as the state backend.

**Tech Stack:** `@upstash/ratelimit`, `@upstash/redis`, Next.js 16 Edge Middleware, Clerk auth

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `src/lib/rate-limit.ts` | Create | Shared rate limiter config + `withRateLimit()` wrapper |
| `src/lib/rate-limit-edge.ts` | Create | Edge-compatible rate limiter for middleware |
| `src/proxy.ts` | Modify | Add Edge rate limiting + block `/api/seed`, `/api/migrate` |
| `src/app/actions/invoices.ts` | Modify | Wrap mutations with `withRateLimit()` |
| `src/app/actions/clients.ts` | Modify | Wrap mutations with `withRateLimit()` |
| `src/app/actions/freelancer.ts` | Modify | Wrap mutations with `withRateLimit()` |
| `src/app/actions/admin.ts` | Modify | Wrap actions with `withRateLimit()` |
| `src/app/api/auth/me/route.ts` | Modify | Add rate limiting |
| `src/app/api/stripe/checkout/route.ts` | Modify | Add rate limiting |
| `src/app/api/stripe/portal/route.ts` | Modify | Add rate limiting |
| `src/components/auth/auth-provider.tsx` | Modify | Handle 429 errors with toast |
| `next.config.ts` | Modify | Add CSP header |
| `.env.example` | Modify | Add Upstash env vars |

---

### Task 1: Install Dependencies & Configure Environment

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`

- [ ] **Step 1: Install Upstash packages**

```bash
npm install @upstash/ratelimit @upstash/redis
```

- [ ] **Step 2: Add env vars to `.env.example`**

Append to `.env.example`:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add @upstash/ratelimit and @upstash/redis dependencies"
```

---

### Task 2: Create Rate Limiter Core (`src/lib/rate-limit.ts`)

**Files:**
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Create the rate limiter module**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/lib/rate-limit.ts
```

Expected: No errors (or only env var warnings which are expected at compile time)

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add rate limiter core with withRateLimit wrapper"
```

---

### Task 3: Create Edge Rate Limiter (`src/lib/rate-limit-edge.ts`)

**Files:**
- Create: `src/lib/rate-limit-edge.ts`

- [ ] **Step 1: Create the Edge-compatible rate limiter**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rate-limit-edge.ts
git commit -m "feat: add Edge-compatible rate limiters for public routes"
```

---

### Task 4: Update Edge Middleware with Rate Limiting

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Read current proxy.ts**

Read `src/proxy.ts` to understand the current structure.

- [ ] **Step 2: Rewrite proxy.ts with rate limiting**

Replace the entire content of `src/proxy.ts` with:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { rateLimitPublic, rateLimitSignIn, rateLimitSignUp } from '@/lib/rate-limit-edge';

const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/webhook',
]);

const blockedRoutes = ['/api/seed', '/api/migrate'];

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Test mode: bypass everything
  if (process.env.PLAYWRIGHT_TEST === '1') {
    return NextResponse.next();
  }

  // Block sensitive endpoints
  if (blockedRoutes.some((r) => pathname.startsWith(r))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Rate limit by IP for public routes
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (pathname.startsWith('/sign-in')) {
    const { success, reset } = await rateLimitSignIn.limit(ip);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return new NextResponse(JSON.stringify({
        error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      });
    }
  } else if (pathname.startsWith('/sign-up')) {
    const { success, reset } = await rateLimitSignUp.limit(ip);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return new NextResponse(JSON.stringify({
        error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      });
    }
  } else if (publicRoutes(request)) {
    const { success, reset } = await rateLimitPublic.limit(ip);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return new NextResponse(JSON.stringify({
        error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      });
    }
  }

  // Protect non-public routes with Clerk
  if (!publicRoutes(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add Edge rate limiting and block /api/seed, /api/migrate"
```

---

### Task 5: Add Rate Limiting to Server Actions

**Files:**
- Modify: `src/app/actions/clients.ts`
- Modify: `src/app/actions/invoices.ts`
- Modify: `src/app/actions/freelancer.ts`
- Modify: `src/app/actions/admin.ts`

- [ ] **Step 1: Update clients.ts**

In `src/app/actions/clients.ts`, add import at top:

```typescript
import { withRateLimit, rateLimitWrite, RateLimitError } from '@/lib/rate-limit';
```

Wrap `createClient` body:

```typescript
export async function createClient(form: Omit<Client, 'id' | 'totalInvoiced' | 'status' | 'color' | 'initials'>): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'No autorizado' };

    return withRateLimit(userId, rateLimitWrite, async () => {
      // Server-side plan limit enforcement
      const userPlan = await getUserPlan(userId);
      if (userPlan) {
        const maxClients = userPlan.max_clients as number;
        if (maxClients > 0) {
          const count = await getClientCount(userId);
          if (count >= maxClients) {
            return { success: false, error: 'Has alcanzado el limite de clientes de tu plan' };
          }
        }
      }

      const initials = getInitials(form.name);
      const color = getClientColor(form.name);

      const result = await db.execute({
        sql: `INSERT INTO clients (user_id, name, company, nit, email, phone, address, tax_type, bank, account_type, account_number, notes, status, color, initials)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [userId, form.name, form.company, form.nit, form.email, form.phone, form.address || '', form.taxType, form.bank || '', form.accountType || 'ahorros', form.accountNumber || '', form.notes || '', color, initials],
      });

      return { success: true, data: { ...form, id: Number(result.lastInsertRowid), totalInvoiced: 0, status: 'active', color, initials } };
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { success: false, error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` };
    }
    return { success: false, error: 'Error interno del servidor' };
  }
}
```

- [ ] **Step 2: Update invoices.ts**

Same pattern — add import and wrap `createInvoice`:

```typescript
import { withRateLimit, rateLimitWrite, RateLimitError } from '@/lib/rate-limit';
```

Wrap the body of `createInvoice` with `withRateLimit(userId, rateLimitWrite, async () => { ... })`.

- [ ] **Step 3: Update freelancer.ts**

Wrap `saveFreelancerProfile` and `saveNotificationPrefs` with `withRateLimit(userId, rateLimitWrite, ...)`.

- [ ] **Step 4: Update admin.ts**

Wrap all admin mutation functions (`updateTicketStatus`, `toggleFeatureFlag`) with `withRateLimit(userId, rateLimitAuthenticated, ...)`.

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/clients.ts src/app/actions/invoices.ts src/app/actions/freelancer.ts src/app/actions/admin.ts
git commit -m "feat: add rate limiting to server actions"
```

---

### Task 6: Add Rate Limiting to API Routes

**Files:**
- Modify: `src/app/api/auth/me/route.ts`
- Modify: `src/app/api/stripe/checkout/route.ts`
- Modify: `src/app/api/stripe/portal/route.ts`

- [ ] **Step 1: Update `/api/auth/me`**

Read `src/app/api/auth/me/route.ts`, then add rate limiting:

```typescript
import { withRateLimit, rateLimitAuthenticated, RateLimitError } from '@/lib/rate-limit';
import { getAuthUserId } from '@/lib/server-auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    return withRateLimit(userId, rateLimitAuthenticated, async () => {
      // existing logic...
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return Response.json(
        { error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      );
    }
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update `/api/stripe/checkout`**

Same pattern with `rateLimitStripe` (5 req/min).

- [ ] **Step 3: Update `/api/stripe/portal`**

Same pattern with `rateLimitStripe`.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/me/route.ts src/app/api/stripe/checkout/route.ts src/app/api/stripe/portal/route.ts
git commit -m "feat: add rate limiting to API routes"
```

---

### Task 7: Handle 429 Errors in Frontend

**Files:**
- Modify: `src/components/auth/auth-provider.tsx`

- [ ] **Step 1: Read current auth-provider.tsx**

Read `src/components/auth/auth-provider.tsx` to understand the structure.

- [ ] **Step 2: Add 429 handling to fetchAuth**

In the `fetchAuth` function (or wherever `/api/auth/me` is called), add handling for 429 responses:

```typescript
const res = await fetch('/api/auth/me');
if (res.status === 429) {
  toast.error('Límite de solicitudes alcanzado. Espera un momento antes de continuar.');
  return;
}
```

- [ ] **Step 3: Add 429 handling to server action calls**

In any `useEffect` or handler that calls server actions, catch rate limit errors:

```typescript
const result = await someAction();
if (!result.success && result.error?.includes('Límite de solicitudes')) {
  toast.error(result.error);
  return;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/auth-provider.tsx
git commit -m "feat: handle 429 rate limit errors in frontend"
```

---

### Task 8: Add CSP Header

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Read current next.config.ts**

Read `next.config.ts` to see existing headers.

- [ ] **Step 2: Add Content-Security-Policy header**

Add to the existing `headers()` array:

```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.accounts.dev *.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: *.clerk.accounts.dev",
    "font-src 'self'",
    "connect-src 'self' *.clerk.accounts.dev *.stripe.com *.upstash.io",
    "frame-ancestors 'none'",
  ].join('; '),
}
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add Content-Security-Policy header"
```

---

### Task 9: Integration Test — Verify Rate Limiting Works

**Files:**
- Create: `e2e/tests/rate-limit/rate-limit.spec.ts`

- [ ] **Step 1: Write test for blocked endpoints**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Rate Limiting & Security', () => {
  test('GET /api/seed should return 403', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/seed');
    expect(response.status()).toBe(403);
  });

  test('GET /api/migrate should return 403', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/migrate');
    expect(response.status()).toBe(403);
  });

  test('POST /api/seed should return 403', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/seed');
    expect(response.status()).toBe(403);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/tests/rate-limit/rate-limit.spec.ts --project=chromium
```

Expected: All 3 tests pass

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/rate-limit/rate-limit.spec.ts
git commit -m "test: add rate limiting and security endpoint tests"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx playwright test --project=chromium
```

Expected: All tests pass (including existing 40 + new 3)

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Manual verification with curl**

```bash
# Should return 403
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/seed

# Should return 403
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/migrate
```

Expected: Both return `403`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete rate limiting and security hardening

- Hybrid rate limiting: Edge (IP) + Application (userId)
- Upstash Redis backend
- Blocked /api/seed and /api/migrate
- CSP headers added
- 429 handling in frontend"
```
