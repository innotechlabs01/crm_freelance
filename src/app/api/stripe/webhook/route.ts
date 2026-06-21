import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/db/client'
import type { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import type { InValue } from '@libsql/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const body = await request.text()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const planId = session.metadata?.plan_id

        if (!userId || !planId) break

        const customerId = session.customer as string
        const subId = crypto.randomUUID()
        const auditId = crypto.randomUUID()

        // Upsert subscription: check if user already has one
        const existingSub = await db.execute({
          sql: 'SELECT id FROM subscriptions WHERE user_id = ?',
          args: [userId],
        })

        if (existingSub.rows.length > 0) {
          await db.execute({
            sql: `UPDATE subscriptions SET
                    stripe_customer_id = ?, status = 'active', plan_id = ?,
                    renewal_at = datetime('now', '+30 days'), updated_at = datetime('now')
                  WHERE user_id = ?`,
            args: [customerId, planId, userId],
          })
        } else {
          await db.execute({
            sql: `INSERT INTO subscriptions (id, user_id, stripe_customer_id, status, plan_id, renewal_at)
                  VALUES (?, ?, ?, 'active', ?, datetime('now', '+30 days'))`,
            args: [subId, userId, customerId, planId],
          })
        }

        // Assign role using role_id lookup
        await db.execute({
          sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id)
                SELECT ?, r.id FROM roles r WHERE r.name = 'PROFESSIONAL_USER'`,
          args: [userId],
        })

        // Audit log with correct column names
        await db.execute({
          sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                VALUES (?, ?, 'subscription_created', ?, datetime('now'))`,
          args: [auditId, userId, JSON.stringify({ plan_id: planId, stripe_customer_id: customerId })],
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const periodEnd: InValue =
          (subscription.items?.data[0] as unknown as Record<string, unknown> | undefined)
            ?.current_period_end as number | undefined ??
          Math.floor(Date.now() / 1000) + 30 * 86400

        await db.execute(
          `UPDATE subscriptions SET
             status = ?,
             renewal_at = datetime(? / 1000, 'unixepoch'),
             updated_at = datetime('now')
           WHERE stripe_customer_id = ?`,
          [subscription.status as InValue, periodEnd, customerId],
        )

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db.execute(
          `UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now') WHERE stripe_customer_id = ?`,
          [customerId],
        )

        // Downgrade role using role_id lookup
        await db.execute({
          sql: `UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'FREE_USER')
                WHERE user_id = (SELECT user_id FROM subscriptions WHERE stripe_customer_id = ?)`,
          args: [customerId],
        })

        // Audit log with correct column names
        await db.execute({
          sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                SELECT ?, user_id, 'subscription_cancelled', '{}', datetime('now')
                FROM subscriptions WHERE stripe_customer_id = ?`,
          args: [crypto.randomUUID(), customerId],
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const periodEnd: InValue =
          invoice.lines.data[0]?.period?.end ?? Math.floor(Date.now() / 1000) + 30 * 86400

        await db.execute(
          `UPDATE subscriptions SET
             renewal_at = datetime(?, 'unixepoch'),
             status = 'active',
             updated_at = datetime('now')
           WHERE stripe_customer_id = ?`,
          [periodEnd, customerId],
        )

        await db.execute({
          sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                SELECT ?, user_id, 'invoice_paid', ?, datetime('now')
                FROM subscriptions WHERE stripe_customer_id = ?`,
          args: [crypto.randomUUID(), JSON.stringify({ invoice_id: invoice.id, amount: invoice.amount_paid }), customerId],
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await db.execute(
          `UPDATE subscriptions SET status = 'past_due', updated_at = datetime('now') WHERE stripe_customer_id = ?`,
          [customerId],
        )

        await db.execute({
          sql: `INSERT INTO audit_logs (id, user_id, action, metadata, created_at)
                SELECT ?, user_id, 'invoice_payment_failed', ?, datetime('now')
                FROM subscriptions WHERE stripe_customer_id = ?`,
          args: [crypto.randomUUID(), JSON.stringify({ invoice_id: invoice.id }), customerId],
        })

        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
