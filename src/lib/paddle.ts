import { Environment, type EventEntity, type EventName } from '@paddle/paddle-node-sdk'
import { Paddle } from '@paddle/paddle-node-sdk'

const LIVE_API_KEY = process.env.PADDLE_LIVE_API_KEY || ''
const SANDBOX_API_KEY = process.env.PADDLE_SANDBOX_API_KEY || ''
const LIVE_SECRET = process.env.PADDLE_LIVE_WEBHOOK_SECRET || ''
const SANDBOX_SECRET = process.env.PADDLE_SANDBOX_WEBHOOK_SECRET || ''

function isLiveMode(): boolean {
  return process.env.PADDLE_LIVE === '1'
}

function getConfig() {
  if (isLiveMode()) {
    return {
      apiKey: LIVE_API_KEY,
      webhookSecret: LIVE_SECRET,
      environment: Environment.production,
    }
  }
  return {
    apiKey: SANDBOX_API_KEY,
    webhookSecret: SANDBOX_SECRET,
    environment: Environment.sandbox,
  }
}

const config = getConfig()
const paddle = new Paddle(config.apiKey, { environment: config.environment })

export { paddle, type EventName, type EventEntity }

export function getPaddleWebhookSecret(): string {
  return config.webhookSecret
}

export interface PaddleCheckoutResult {
  url: string
  checkoutId: string
}

export const paddleApi = {
  async createCheckout(priceId: string, userId: string, successUrl: string): Promise<PaddleCheckoutResult> {
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId },
      checkout: { url: successUrl },
    })

    return {
      url: transaction.checkout?.url ?? '',
      checkoutId: transaction.id,
    }
  },

  async getSubscription(subscriptionId: string) {
    const sub = await paddle.subscriptions.get(subscriptionId)
    return sub
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: 'immediately' })
  },

  async getCustomerPortalUrl(subscriptionId: string): Promise<string> {
    const sub = await paddle.subscriptions.get(subscriptionId)
    if (!sub.customerId) return ''

    const session = await paddle.customerPortalSessions.create(sub.customerId, [subscriptionId])
    return session.urls.general.overview
  },
}
