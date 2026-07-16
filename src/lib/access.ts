import { db } from '@/db/client'

/**
 * Access-granting statuses: active and trialing grant access.
 * canceled/revoked = no access. past_due/grace period still grants access.
 */
const ACCESS_GRANTING_STATUSES = ['active', 'trialing']

export interface SubscriptionInfo {
  subscription_id: string
  customer_id: string
  user_id: string
  status: string
  price_id: string
  product_id: string
  scheduled_change_action: string | null
  scheduled_change_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Check if a user currently has paid access.
 * Returns the subscription info if they have access, null otherwise.
 */
export async function getUserAccess(userId: string): Promise<SubscriptionInfo | null> {
  const result = await db.execute({
    sql: `SELECT * FROM paddle_subscriptions
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 1`,
    args: [userId],
  })

  if (result.rows.length === 0) return null

  const row = result.rows[0] as unknown as SubscriptionInfo

  // Only revoke access when status is actually 'canceled'
  // Don't revoke just because scheduled_change exists
  if (!ACCESS_GRANTING_STATUSES.includes(row.status)) {
    return null
  }

  return row
}

/**
 * Check if a user has active access (boolean helper).
 */
export async function hasActiveAccess(userId: string): Promise<boolean> {
  const access = await getUserAccess(userId)
  return access !== null
}

/**
 * Get customer by user_id.
 */
export async function getCustomerByUserId(userId: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE user_id = ?',
    args: [userId],
  })
  return result.rows[0] || null
}

/**
 * Get customer by Paddle customer_id.
 */
export async function getCustomerByPaddleId(customerId: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE customer_id = ?',
    args: [customerId],
  })
  return result.rows[0] || null
}

/**
 * Get subscription by Paddle subscription_id.
 */
export async function getSubscriptionByPaddleId(subscriptionId: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM paddle_subscriptions WHERE subscription_id = ?',
    args: [subscriptionId],
  })
  return result.rows[0] || null
}
