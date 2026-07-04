import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/client'
import { paddleApi } from '@/lib/paddle'
import { withRateLimit, rateLimitLemonsqueezy, RateLimitError } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return withRateLimit(userId, rateLimitLemonsqueezy, async () => {
      const { planName } = await request.json()

      const result = await db.execute({
        sql: 'SELECT id, paddle_price_id FROM plans WHERE name = ? AND is_active = 1',
        args: [planName],
      })
      const plan = result.rows[0]
      if (!plan || !plan.paddle_price_id) {
        return NextResponse.json({ error: 'Plan no encontrado o no configurado con Paddle' }, { status: 404 })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const successUrl = `${appUrl}/configuracion?checkout=success`

      const result_1 = await paddleApi.createCheckout(
        String(plan.paddle_price_id),
        userId,
        successUrl
      )

      return NextResponse.json({ url: result_1.url })
    })
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: `Limite de solicitudes alcanzado. Intenta en ${e.retryAfter} segundos.` },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      )
    }
    console.error('Paddle checkout error:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
