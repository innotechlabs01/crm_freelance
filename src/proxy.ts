import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { rateLimitPublic, rateLimitSignIn, rateLimitSignUp } from '@/lib/rate-limit-edge';

const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/lemonsqueezy/webhook',
  '/api/paddle/webhook',
  '/api/seed',
  '/api/migrate',
]);

const blockedRoutes: string[] = [];

function rateLimitExceeded(reset: number): NextResponse {
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

async function tryLimit(limiter: { limit: (key: string) => Promise<{ success: boolean; reset: number }> }, key: string): Promise<NextResponse | null> {
  try {
    const { success, reset } = await limiter.limit(key);
    if (!success) {
      return rateLimitExceeded(reset);
    }
  } catch {
    // Fail open: allow the request through if Redis is unavailable
  }
  return null;
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // Block sensitive endpoints (always, even in test mode)
  if (blockedRoutes.some((r) => pathname.startsWith(r))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Test mode: bypass rate limiting and auth
  if (process.env.PLAYWRIGHT_TEST === '1') {
    return NextResponse.next();
  }

  // Rate limit by IP for public routes
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (pathname.startsWith('/sign-in')) {
    const res = await tryLimit(rateLimitSignIn, ip);
    if (res) return res;
  } else if (pathname.startsWith('/sign-up')) {
    const res = await tryLimit(rateLimitSignUp, ip);
    if (res) return res;
  } else if (publicRoutes(request)) {
    const res = await tryLimit(rateLimitPublic, ip);
    if (res) return res;
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
