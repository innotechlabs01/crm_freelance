import { Environment, type EventEntity, type EventName } from '@paddle/paddle-node-sdk'
import { Paddle } from '@paddle/paddle-node-sdk'

function isLiveMode(): boolean {
  if (process.env.PADDLE_LIVE === '1') return true
  if (process.env.PADDLE_LIVE === '0') return false
  return process.env.VERCEL_ENV === 'production'
}

function getConfig() {
  const liveKey = process.env.PADDLE_LIVE_API_KEY || ''
  const sandboxKey = process.env.PADDLE_SANDBOX_API_KEY || ''

  if (isLiveMode()) {
    return {
      apiKey: liveKey,
      webhookSecret: process.env.PADDLE_LIVE_WEBHOOK_SECRET || '',
      environment: Environment.production,
    }
  }
  return {
    apiKey: sandboxKey,
    webhookSecret: process.env.PADDLE_SANDBOX_WEBHOOK_SECRET || '',
    environment: Environment.sandbox,
  }
}

let paddleInstance: Paddle | null = null

function getPaddle(): Paddle {
  if (paddleInstance) return paddleInstance
  const config = getConfig()
  if (!config.apiKey) {
    throw new Error('Paddle API key no configurada. Verifica PADDLE_SANDBOX_API_KEY en .env.local')
  }
  paddleInstance = new Paddle(config.apiKey, { environment: config.environment })
  return paddleInstance
}

export { type EventName, type EventEntity }

export function getPaddleWebhookSecret(): string {
  return getConfig().webhookSecret
}

export function getPaddleForWebhook(): Paddle {
  return getPaddle()
}

export interface PaddleCheckoutResult {
  url: string
  checkoutId: string
}

export const paddleApi = {
  async createCheckout(priceId: string, userId: string, successUrl: string): Promise<PaddleCheckoutResult> {
    try {
      const paddle = getPaddle()
      const transaction = await paddle.transactions.create({
        items: [{ priceId, quantity: 1 }],
        customData: { userId },
      })

      return {
        url: transaction.checkout?.url ?? '',
        checkoutId: transaction.id,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[paddle] createCheckout error:', msg)

      // Paddle requires a default payment link in the dashboard
      if (msg.includes('transaction_default_checkout_url_not_set') || msg.includes('Default Payment Link')) {
        throw new Error(
          'Paddle no esta completamente configurado. ' +
          'Ve al dashboard de Paddle Sandbox > Checkout Settings y crea un "Default Payment Link", ' +
          'luego intenta de nuevo.'
        )
      }

      throw new Error(`Paddle error: ${msg}`)
    }
  },

  async getSubscription(subscriptionId: string) {
    const paddle = getPaddle()
    return paddle.subscriptions.get(subscriptionId)
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const paddle = getPaddle()
    await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: 'immediately' })
  },

  async getCustomerPortalUrl(subscriptionId: string): Promise<string> {
    const paddle = getPaddle()
    const sub = await paddle.subscriptions.get(subscriptionId)
    if (!sub.customerId) return ''

    const session = await paddle.customerPortalSessions.create(sub.customerId, [subscriptionId])
    return session.urls.general.overview
  },
}
