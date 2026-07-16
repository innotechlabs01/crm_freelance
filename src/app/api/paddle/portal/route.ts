import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/client'
import { paddleApi } from '@/lib/paddle'
import { withRateLimit, rateLimitLemonsqueezy, RateLimitError } from '@/lib/rate-limit'

export async function GET() {
  try {
    // Step 1: Verify user is authenticated FIRST
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return withRateLimit(userId, rateLimitLemonsqueezy, async () => {
      // Step 2: Look up customer by user_id (never trust client-supplied customer ID)
      const customerResult = await db.execute({
        sql: 'SELECT customer_id FROM customers WHERE user_id = ?',
        args: [userId],
      })

      const customerId = customerResult.rows[0]?.customer_id as string | undefined
      if (!customerId) {
        return NextResponse.json({ error: 'No customer found for this user' }, { status: 404 })
      }

      // Step 3: Get subscription for this user
      const subResult = await db.execute({
        sql: 'SELECT subscription_id FROM paddle_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [userId],
      })

      const subscriptionId = subResult.rows[0]?.subscription_id as string | undefined
      if (!subscriptionId) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
      }

      // Step 4: Mint customer portal session
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
