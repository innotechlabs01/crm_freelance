import { createHmac, timingSafeEqual } from 'crypto'

const LIVE_API_KEY = process.env.LEMONSQUEEZY_LIVE_API_KEY
const LIVE_STORE_ID = process.env.LEMONSQUEEZY_LIVE_STORE_ID
const LIVE_SIGNING_SECRET = process.env.LEMONSQUEEZY_LIVE_SIGNING_SECRET

const TEST_API_KEY = process.env.LEMONSQUEEZY_TEST_API_KEY
const TEST_STORE_ID = process.env.LEMONSQUEEZY_TEST_STORE_ID
const TEST_SIGNING_SECRET = process.env.LEMONSQUEEZY_TEST_SIGNING_SECRET

const API_BASE = 'https://api.lemonsqueezy.com/v1'

function isTestMode(): boolean {
  return process.env.NODE_ENV === 'development'
}

function getConfig() {
  if (isTestMode()) {
    return {
      apiKey: TEST_API_KEY!,
      storeId: TEST_STORE_ID!,
      signingSecret: TEST_SIGNING_SECRET!,
    }
  }
  return {
    apiKey: LIVE_API_KEY!,
    storeId: LIVE_STORE_ID!,
    signingSecret: LIVE_SIGNING_SECRET!,
  }
}

async function lemonFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { apiKey } = getConfig()
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Lemon Squeezy API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const { signingSecret } = getConfig()
  const hmac = createHmac('sha256', signingSecret)
  const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8')
  const sig = Buffer.from(signature, 'utf8')

  try {
    return timingSafeEqual(digest, sig)
  } catch {
    return false
  }
}

export interface LemonSqueezyCheckout {
  data: {
    id: string
    attributes: {
      url: string
      test_mode: boolean
      created_at: string
    }
  }
}

export interface LemonSqueezySubscription {
  data: {
    id: string
    attributes: {
      store_id: number
      customer_id: number
      order_id: number
      product_id: number
      variant_id: number
      product_name: string
      variant_name: string
      user_name: string
      user_email: string
      status: string
      status_formatted: string
      cancelled: boolean
      trial_ends_at: string | null
      renews_at: string | null
      ends_at: string | null
      created_at: string
      updated_at: string
      test_mode: boolean
      urls: {
        update_payment_method: string
        customer_portal: string
      }
    }
  }
}

export interface WebhookPayload {
  meta: {
    event_name: string
    custom_data?: {
      user_id?: string
    }
  }
  data: {
    id: string
    type: string
    attributes: Record<string, unknown>
  }
}

export const lemonsqueezy = {
  createCheckout(variantId: string, userId: string): Promise<LemonSqueezyCheckout> {
    const { storeId } = getConfig()
    const testMode = isTestMode()

    return lemonFetch<LemonSqueezyCheckout>('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: {
                user_id: userId,
              },
            },
            checkout_options: {
              embed: false,
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    })
  },

  getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
    return lemonFetch<LemonSqueezySubscription>(`/subscriptions/${subscriptionId}`)
  },

  cancelSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
    return lemonFetch<LemonSqueezySubscription>(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })
  },
}
