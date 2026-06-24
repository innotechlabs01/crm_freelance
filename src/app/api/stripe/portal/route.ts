import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db/client';
import { withRateLimit, rateLimitStripe, RateLimitError } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return withRateLimit(userId, rateLimitStripe, async () => {
      const subscriptionResult = await db.execute({
        sql: 'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [userId],
      });

      const stripeCustomerId = subscriptionResult.rows[0]?.stripe_customer_id as string | undefined;
      if (!stripeCustomerId) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${appUrl}/configuracion`,
      });

      return NextResponse.json({ url: session.url });
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Límite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      );
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
