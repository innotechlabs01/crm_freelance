import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'
import type { WebhookPayload } from '@/lib/lemonsqueezy'
import { db } from '@/db/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const sig = request.headers.get('x-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature header' }, { status: 400 })
  }

  const body = await request.text()

  if (!verifyWebhookSignature(body, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let parsed: WebhookPayload
  try {
    parsed = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = parsed.meta.event_name
  const customData = parsed.meta.custom_data
  const subscriptionId = parsed.data.id
  const attrs = parsed.data.attributes as Record<string, unknown>

  try {
    switch (eventName) {
      case 'order_created':
      case 'subscription_created': {
        const userId = customData?.user_id
        if (!userId || parsed.data.type !== 'subscriptions') break

        const status = String(attrs.status || 'active')
        const renewsAt = attrs.renews_at ? String(attrs.renews_at) : null

        const subResult = await db.execute({
          sql: 'SELECT id FROM subscriptions WHERE lemonsqueezy_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length === 0) {
          const planResult = await db.execute({
            sql: 'SELECT id FROM plans WHERE name = ?',
            args: ['professional'],
          })
          const planId = planResult.rows[0]?.id
          if (!planId) break

          await db.execute({
            sql: `INSERT INTO subscriptions (id, user_id, plan_id, lemonsqueezy_subscription_id, status, starts_at, renewal_at)
                  VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`,
            args: [crypto.randomUUID(), userId, planId, subscriptionId, status, renewsAt],
          })

          await db.execute({
            sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id)
                  SELECT ?, r.id FROM roles r WHERE r.name = 'PROFESSIONAL_USER'`,
            args: [userId],
          })

          await db.execute({
            sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                  VALUES (?, ?, 'subscription_created', ?, datetime('now'))`,
            args: [crypto.randomUUID(), userId, JSON.stringify({
              lemonsqueezy_subscription_id: subscriptionId,
              event: eventName,
            })],
          })
        }
        break
      }

      case 'subscription_payment_success': {
        const subResult = await db.execute({
          sql: 'SELECT user_id FROM subscriptions WHERE lemonsqueezy_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const userId = subResult.rows[0].user_id as string

          await db.execute({
            sql: `UPDATE subscriptions SET status = 'active',
                    renewal_at = ?,
                    updated_at = datetime('now')
                  WHERE lemonsqueezy_subscription_id = ?`,
            args: [attrs.renews_at ? String(attrs.renews_at) : null, subscriptionId],
          })

          await db.execute({
            sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id)
                  SELECT ?, r.id FROM roles r WHERE r.name = 'PROFESSIONAL_USER'`,
            args: [userId],
          })

          await db.execute({
            sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                  VALUES (?, ?, 'invoice_paid', ?, datetime('now'))`,
            args: [crypto.randomUUID(), userId, JSON.stringify({
              lemonsqueezy_subscription_id: subscriptionId,
              event: eventName,
            })],
          })
        }
        break
      }

      case 'subscription_updated': {
        const subResult = await db.execute({
          sql: 'SELECT id FROM subscriptions WHERE lemonsqueezy_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const status = String(attrs.status || 'active')
          const renewsAt = attrs.renews_at ? String(attrs.renews_at) : null
          const endsAt = attrs.ends_at ? String(attrs.ends_at) : null

          await db.execute({
            sql: `UPDATE subscriptions SET status = ?,
                    renewal_at = ?,
                    ends_at = ?,
                    updated_at = datetime('now')
                  WHERE lemonsqueezy_subscription_id = ?`,
            args: [status, renewsAt, endsAt, subscriptionId],
          })
        }
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const subResult = await db.execute({
          sql: 'SELECT user_id FROM subscriptions WHERE lemonsqueezy_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const userId = subResult.rows[0].user_id as string

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
            args: [crypto.randomUUID(), userId, JSON.stringify({
              lemonsqueezy_subscription_id: subscriptionId,
              reason: eventName,
            })],
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
