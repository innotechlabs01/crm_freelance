import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await request.json();

  const result = await db.execute({
    sql: 'SELECT * FROM plans WHERE id = ?',
    args: [planId],
  });
  const plan = result.rows[0];
  if (!plan || !plan.stripe_price_id) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // Get or create Stripe customer
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
    metadata: { userId, planId },
  });

  return NextResponse.json({ url: session.url });
}
