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
      const { planId, planName } = await request.json();

      const result = await db.execute({
        sql: planId
          ? 'SELECT * FROM plans WHERE id = ? AND is_active = 1'
          : 'SELECT * FROM plans WHERE name = ? AND is_active = 1',
        args: [planId || planName],
      });
      const plan = result.rows[0];
      if (!plan || !plan.stripe_price_id) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      const subResult = await db.execute({
        sql: 'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [userId],
      });

      let customerId = subResult.rows[0]?.stripe_customer_id as string | undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { userId },
        });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: plan.stripe_price_id as string, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?upgrade=cancelled`,
        client_reference_id: userId,
        customer: customerId,
        metadata: { userId, plan_id: plan.id as string },
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
