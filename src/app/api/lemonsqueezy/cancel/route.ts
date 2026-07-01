import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { lemonsqueezy } from '@/lib/lemonsqueezy'
import { db } from '@/db/client'
import { withRateLimit, rateLimitLemonsqueezy, RateLimitError } from '@/lib/rate-limit'

export async function POST() {
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

      await lemonsqueezy.cancelSubscription(subscriptionId)

      await db.execute({
        sql: `UPDATE subscriptions SET status = 'canceled',
                updated_at = datetime('now')
              WHERE lemonsqueezy_subscription_id = ?`,
        args: [subscriptionId],
      })

      await db.execute({
        sql: `UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'FREE_USER')
              WHERE user_id = ?`,
        args: [userId],
      })

      await db.execute({
        sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
              VALUES (?, ?, 'subscription_cancelled', ?, datetime('now'))`,
        args: [crypto.randomUUID(), userId, JSON.stringify({ lemonsqueezy_subscription_id: subscriptionId })],
      })

      return NextResponse.json({ success: true })
    })
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Limite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      )
    }
    console.error('Cancel error:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
