import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/client'
import { paddleApi } from '@/lib/paddle'
import { withRateLimit, rateLimitLemonsqueezy, RateLimitError } from '@/lib/rate-limit'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return withRateLimit(userId, rateLimitLemonsqueezy, async () => {
      const subResult = await db.execute({
        sql: 'SELECT paddle_subscription_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [userId],
      })

      const subscriptionId = subResult.rows[0]?.paddle_subscription_id as string | undefined
      if (!subscriptionId) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
      }

      const portalUrl = await paddleApi.getCustomerPortalUrl(subscriptionId)

      if (!portalUrl) {
        return NextResponse.json({ error: 'Customer portal not available' }, { status: 404 })
      }

      return NextResponse.json({ portalUrl })
    })
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Limite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      )
    }
    console.error('Paddle portal error:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
