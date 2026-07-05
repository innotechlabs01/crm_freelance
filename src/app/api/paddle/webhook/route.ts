import { NextResponse } from 'next/server'
import { getPaddleForWebhook, getPaddleWebhookSecret, type EventEntity } from '@/lib/paddle'
import { db } from '@/db/client'
import {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('paddle-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing paddle-signature header' }, { status: 400 })
  }

  let event: EventEntity
  try {
    event = await getPaddleForWebhook().webhooks.unmarshal(body, getPaddleWebhookSecret(), signature)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventType = event.eventType
  const eventData = event.data as unknown as Record<string, unknown>
  const subscriptionId = eventData.id as string
  const customData = eventData.customData as { userId?: string } | undefined | null
  const userId = customData?.userId

  try {
    switch (eventType) {
      case 'subscription.created': {
        if (!userId) break

        const status = (eventData.status as string) || 'active'
        const nextBilledAt = eventData.nextBilledAt as string | null
        const userEmail = (eventData.email as string) || ''

        const subResult = await db.execute({
          sql: 'SELECT id FROM subscriptions WHERE paddle_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length === 0) {
          const planResult = await db.execute({
            sql: 'SELECT id, display_name FROM plans WHERE name = ?',
            args: ['professional'],
          })
          const planId = planResult.rows[0]?.id
          const planDisplayName = planResult.rows[0]?.display_name as string || 'Professional'
          if (!planId) break

          await db.execute({
            sql: `INSERT INTO subscriptions (id, user_id, plan_id, paddle_subscription_id, status, starts_at, renewal_at)
                  VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`,
            args: [crypto.randomUUID(), userId, planId, subscriptionId, status, nextBilledAt],
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
              paddle_subscription_id: subscriptionId,
              event: eventType,
            })],
          })

          if (userEmail) {
            sendWelcomeEmail(userEmail, planDisplayName)
          }
        }
        break
      }

      case 'transaction.completed': {
        if (!subscriptionId) break

        const subResult = await db.execute({
          sql: 'SELECT user_id FROM subscriptions WHERE paddle_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const existingUserId = subResult.rows[0].user_id as string
          const userEmail = (eventData.email as string) || ''

          await db.execute({
            sql: `UPDATE subscriptions SET status = 'active',
                    renewal_at = ?,
                    grace_period_ends_at = NULL,
                    updated_at = datetime('now')
                  WHERE paddle_subscription_id = ?`,
            args: [(eventData.nextBilledAt as string) || null, subscriptionId],
          })

          await db.execute({
            sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id)
                  SELECT ?, r.id FROM roles r WHERE r.name = 'PROFESSIONAL_USER'`,
            args: [existingUserId],
          })

          await db.execute({
            sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                  VALUES (?, ?, 'invoice_paid', ?, datetime('now'))`,
            args: [crypto.randomUUID(), existingUserId, JSON.stringify({
              paddle_subscription_id: subscriptionId,
              event: eventType,
            })],
          })

          if (userEmail) {
            const items = eventData.items as Array<{ price?: { name?: string } }> | undefined
            sendPaymentSuccessEmail(userEmail, items?.[0]?.price?.name || '')
          }
        }
        break
      }

      case 'transaction.payment_failed': {
        if (!subscriptionId) break

        const subResult = await db.execute({
          sql: 'SELECT user_id FROM subscriptions WHERE paddle_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const existingUserId = subResult.rows[0].user_id as string
          const userEmail = (eventData.email as string) || ''
          const GRACE_DAYS = 7

          await db.execute({
            sql: `UPDATE subscriptions SET status = 'past_due',
                    grace_period_ends_at = datetime('now', '+${GRACE_DAYS} days'),
                    updated_at = datetime('now')
                  WHERE paddle_subscription_id = ?`,
            args: [subscriptionId],
          })

          await db.execute({
            sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                  VALUES (?, ?, 'payment_failed', ?, datetime('now'))`,
            args: [crypto.randomUUID(), existingUserId, JSON.stringify({
              paddle_subscription_id: subscriptionId,
              grace_period_ends_at: new Date(Date.now() + GRACE_DAYS * 86400000).toISOString(),
            })],
          })

          if (userEmail) {
            sendPaymentFailedEmail(userEmail, GRACE_DAYS)
          }
        }
        break
      }

      case 'subscription.updated': {
        if (!subscriptionId) break

        const subResult = await db.execute({
          sql: 'SELECT id FROM subscriptions WHERE paddle_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const status = (eventData.status as string) || 'active'

          await db.execute({
            sql: `UPDATE subscriptions SET status = ?,
                    renewal_at = ?,
                    updated_at = datetime('now')
                  WHERE paddle_subscription_id = ?`,
            args: [status, (eventData.nextBilledAt as string) || null, subscriptionId],
          })
        }
        break
      }

      case 'subscription.canceled': {
        if (!subscriptionId) break

        const subResult = await db.execute({
          sql: 'SELECT user_id FROM subscriptions WHERE paddle_subscription_id = ?',
          args: [subscriptionId],
        })

        if (subResult.rows.length > 0) {
          const existingUserId = subResult.rows[0].user_id as string
          const userEmail = (eventData.email as string) || ''

          await db.execute({
            sql: `UPDATE subscriptions SET status = 'canceled',
                    updated_at = datetime('now')
                  WHERE paddle_subscription_id = ?`,
            args: [subscriptionId],
          })

          await db.execute({
            sql: `UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'FREE_USER')
                  WHERE user_id = ?`,
            args: [existingUserId],
          })

          await db.execute({
            sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                  VALUES (?, ?, 'subscription_cancelled', ?, datetime('now'))`,
            args: [crypto.randomUUID(), existingUserId, JSON.stringify({
              paddle_subscription_id: subscriptionId,
              event: eventType,
            })],
          })

          if (userEmail) {
            sendSubscriptionCancelledEmail(userEmail)
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('Paddle webhook handler error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
