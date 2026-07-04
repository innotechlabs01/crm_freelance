import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/client'
import { lemonsqueezy } from '@/lib/lemonsqueezy'
import { withRateLimit, rateLimitLemonsqueezy, RateLimitError } from '@/lib/rate-limit'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return withRateLimit(userId, rateLimitLemonsqueezy, async () => {
      const subResult = await db.execute({
        sql: 'SELECT lemonsqueezy_subscription_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [userId],
      })

      const subscriptionId = subResult.rows[0]?.lemonsqueezy_subscription_id as string | undefined
      if (!subscriptionId) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
      }

      const { data: subscription } = await lemonsqueezy.getSubscription(subscriptionId)

      return NextResponse.json({
        portalUrl: subscription.attributes.urls.customer_portal,
        updatePaymentUrl: subscription.attributes.urls.update_payment_method,
      })
    })
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Limite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      )
    }
    console.error('Portal error:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
