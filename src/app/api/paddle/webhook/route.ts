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

/**
 * Webhook handler for Paddle events.
 * 
 * Flow:
 * 1. Read raw body as text (NOT JSON.parsed)
 * 2. Verify signature with paddle.webhooks.unmarshal
 * 3. Route verified events to handlers
 * 4. Return 2xx only on success
 */

// ---------- Helpers ----------

async function upsertCustomer(data: Record<string, unknown>) {
  const customerId = data.id as string
  const email = (data.email as string) || ''
  const customData = data.customData as { userId?: string } | undefined | null
  const userId = customData?.userId

  if (!customerId) return null

  await db.execute({
    sql: `INSERT INTO customers (customer_id, user_id, email, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(customer_id) DO UPDATE SET
            email = excluded.email,
            user_id = COALESCE(excluded.user_id, customers.user_id),
            updated_at = datetime('now')`,
    args: [customerId, userId || null, email],
  })

  return { customerId, userId, email }
}

async function upsertSubscription(data: Record<string, unknown>) {
  const subscriptionId = data.id as string
  const customerId = data.customerId as string
  const status = (data.status as string) || 'active'
  const priceId = (data.priceId as string) || ''
  const productId = (data.productId as string) || ''
  const scheduledChange = data.scheduledChange as { action?: string; effectiveAt?: string } | null
  const customData = data.customData as { userId?: string } | undefined | null
  const userId = customData?.userId

  if (!subscriptionId || !userId) return null

  // Ensure customer exists
  if (customerId) {
    await db.execute({
      sql: `INSERT INTO customers (customer_id, user_id, email, created_at, updated_at)
            VALUES (?, ?, '', datetime('now'), datetime('now'))
            ON CONFLICT(customer_id) DO UPDATE SET
              user_id = COALESCE(excluded.user_id, customers.user_id),
              updated_at = datetime('now')`,
      args: [customerId, userId],
    })
  }

  await db.execute({
    sql: `INSERT INTO paddle_subscriptions
            (subscription_id, customer_id, user_id, status, price_id, product_id,
             scheduled_change_action, scheduled_change_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(subscription_id) DO UPDATE SET
            status = excluded.status,
            price_id = excluded.price_id,
            product_id = excluded.product_id,
            scheduled_change_action = excluded.scheduled_change_action,
            scheduled_change_at = excluded.scheduled_change_at,
            updated_at = datetime('now')`,
    args: [
      subscriptionId,
      customerId || '',
      userId,
      status,
      priceId,
      productId,
      scheduledChange?.action || null,
      scheduledChange?.effectiveAt || null,
    ],
  })

  return { subscriptionId, userId, customerId, status }
}

// ---------- Event Handlers ----------

async function handleSubscriptionCreated(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const result = await upsertSubscription(data)
  if (!result) {
    console.error('[webhook] subscription.created: missing subscriptionId or userId')
    return
  }

  console.log(`[webhook] subscription.created: ${result.subscriptionId} for user ${result.userId}`)

  // Send welcome email
  const email = (data.email as string) || ''
  if (email) {
    const items = data.items as Array<{ price?: { name?: string } }> | undefined
    sendWelcomeEmail(email, items?.[0]?.price?.name || 'subscription')
  }
}

async function handleSubscriptionUpdated(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const result = await upsertSubscription(data)
  if (!result) {
    console.error('[webhook] subscription.updated: missing subscriptionId or userId')
    return
  }

  console.log(`[webhook] subscription.updated: ${result.subscriptionId} -> status: ${result.status}`)
}

async function handleSubscriptionCanceled(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const result = await upsertSubscription(data)
  if (!result) {
    console.error('[webhook] subscription.canceled: missing subscriptionId or userId')
    return
  }

  console.log(`[webhook] subscription.canceled: ${result.subscriptionId}`)

  // Send cancellation email
  const email = (data.email as string) || ''
  if (email) {
    sendSubscriptionCancelledEmail(email)
  }
}

async function handleCustomerCreated(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const result = await upsertCustomer(data)
  if (!result) {
    console.error('[webhook] customer.created: missing customerId')
    return
  }

  console.log(`[webhook] customer.created: ${result.customerId}`)
}

async function handleCustomerUpdated(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const result = await upsertCustomer(data)
  if (!result) {
    console.error('[webhook] customer.updated: missing customerId')
    return
  }

  console.log(`[webhook] customer.updated: ${result.customerId}`)
}

async function handleTransactionCompleted(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const subscriptionId = data.subscriptionId as string
  const email = (data.email as string) || ''

  if (subscriptionId) {
    // Update subscription to active
    const subResult = await db.execute({
      sql: 'SELECT user_id FROM paddle_subscriptions WHERE subscription_id = ?',
      args: [subscriptionId],
    })

    if (subResult.rows.length > 0) {
      const userId = subResult.rows[0].user_id as string

      await db.execute({
        sql: `UPDATE paddle_subscriptions SET status = 'active', updated_at = datetime('now')
              WHERE subscription_id = ?`,
        args: [subscriptionId],
      })

      console.log(`[webhook] transaction.completed: subscription ${subscriptionId} -> active`)

      // Send payment success email
      if (email) {
        const items = data.items as Array<{ price?: { name?: string } }> | undefined
        sendPaymentSuccessEmail(email, items?.[0]?.price?.name || 'subscription')
      }
    }
  }
}

async function handleTransactionPaymentFailed(event: EventEntity) {
  const data = event.data as unknown as Record<string, unknown>
  const subscriptionId = data.subscriptionId as string
  const email = (data.email as string) || ''
  const GRACE_DAYS = 7

  if (subscriptionId) {
    const subResult = await db.execute({
      sql: 'SELECT user_id FROM paddle_subscriptions WHERE subscription_id = ?',
      args: [subscriptionId],
    })

    if (subResult.rows.length > 0) {
      const userId = subResult.rows[0].user_id as string

      await db.execute({
        sql: `UPDATE paddle_subscriptions SET status = 'past_due', updated_at = datetime('now')
              WHERE subscription_id = ?`,
        args: [subscriptionId],
      })

      console.log(`[webhook] transaction.payment_failed: subscription ${subscriptionId} -> past_due`)

      // Send payment failed email
      if (email) {
        sendPaymentFailedEmail(email, GRACE_DAYS)
      }
    }
  }
}

// ---------- Main Handler ----------

export async function POST(request: NextRequest) {
  // Step 1: Read raw body as text (NOT JSON.parsed)
  const body = await request.text()
  const signature = request.headers.get('paddle-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing paddle-signature header' }, { status: 400 })
  }

  // Step 2: Verify signature with Paddle SDK
  let event: EventEntity
  try {
    event = await getPaddleForWebhook().webhooks.unmarshal(
      body,
      getPaddleWebhookSecret(),
      signature
    )
  } catch {
    // Verification failed - do NOT return 2xx
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventType = event.eventType
  console.log(`[webhook] Verified event: ${eventType}`)

  // Step 3: Route to handlers (idempotent)
  try {
    switch (eventType) {
      case 'subscription.created':
        await handleSubscriptionCreated(event)
        break
      case 'subscription.updated':
        await handleSubscriptionUpdated(event)
        break
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event)
        break
      case 'customer.created':
        await handleCustomerCreated(event)
        break
      case 'customer.updated':
        await handleCustomerUpdated(event)
        break
      case 'transaction.completed':
        await handleTransactionCompleted(event)
        break
      case 'transaction.payment_failed':
        await handleTransactionPaymentFailed(event)
        break
      default:
        // Safely ignore other event types
        console.log(`[webhook] Ignored event: ${eventType}`)
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${eventType}:`, err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Step 4: Return 2xx
  return NextResponse.json({ received: true })
}
