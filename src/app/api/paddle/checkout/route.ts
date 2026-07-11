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

      console.log(`[paddle-checkout] Creating checkout for user ${userId}, plan: ${planName}`)

      const result = await db.execute({
        sql: 'SELECT id, paddle_price_id FROM plans WHERE name = ? AND is_active = 1',
        args: [planName],
      })
      const plan = result.rows[0]
      if (!plan || !plan.paddle_price_id) {
        console.error(`[paddle-checkout] Plan not found or missing paddle_price_id: ${planName}`)
        return NextResponse.json({ error: 'Plan no encontrado o no configurado con Paddle. Verifica que las variables de entorno PADDLE_PRO_PRICE_ID esten configuradas.' }, { status: 404 })
      }

      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
      const proto = request.headers.get('x-forwarded-proto') || 'http'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`
      const successUrl = `${appUrl}/configuracion?checkout=success`

      const result_1 = await paddleApi.createCheckout(
        String(plan.paddle_price_id),
        userId,
        successUrl
      )

      if (!result_1.url) {
        console.error('[paddle-checkout] Paddle did not return a checkout URL')
        return NextResponse.json({ error: 'Paddle no devolvio una URL de checkout. Verifica el API key y el price ID.' }, { status: 500 })
      }

      console.log(`[paddle-checkout] Checkout created successfully for user ${userId}`)
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
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
