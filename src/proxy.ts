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
