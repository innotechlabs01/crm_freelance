import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/client'
import { lemonsqueezy } from '@/lib/lemonsqueezy'
import { withRateLimit, rateLimitLemonsqueezy, RateLimitError } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return withRateLimit(userId, rateLimitLemonsqueezy, async () => {
      const { planId, planName } = await request.json()

      const result = await db.execute({
        sql: planId
          ? 'SELECT * FROM plans WHERE id = ? AND is_active = 1'
          : 'SELECT * FROM plans WHERE name = ? AND is_active = 1',
        args: [planId || planName],
      })
      const plan = result.rows[0]
      if (!plan || !plan.lemonsqueezy_variant_id) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }

      const checkout = await lemonsqueezy.createCheckout(
        String(plan.lemonsqueezy_variant_id),
        userId
      )

      return NextResponse.json({ url: checkout.data.attributes.url })
    })
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Limite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      )
    }
    console.error('Checkout error:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
