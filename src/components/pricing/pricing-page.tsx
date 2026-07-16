'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { initializePaddle, type Paddle, type PricePreviewResponse } from '@paddle/paddle-js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

interface Tier {
  name: 'Starter' | 'Pro' | 'Advanced'
  description: string
  features: string[]
  priceId: { month: string; year: string }
}

interface PricingPageProps {
  tiers: Tier[]
  country?: string
}

export function PricingPage({ tiers, country }: PricingPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const [paddle, setPaddle] = useState<Paddle | undefined>()
  const [annual, setAnnual] = useState(false)
  const [prices, setPrices] = useState<Record<string, PricePreviewResponse['data']['details']['lineItems'][0]>>({})
  const [loading, setLoading] = useState(true)

  // Initialize Paddle
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!token) {
      console.error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set')
      return
    }

    initializePaddle({
      token,
      environment: process.env.PADDLE_LIVE === '1' ? 'production' : 'sandbox',
    }).then((paddleInstance) => {
      setPaddle(paddleInstance)
    })
  }, [])

  // Fetch prices when Paddle is ready or billing period changes
  const fetchPrices = useCallback(async () => {
    if (!paddle) return

    setLoading(true)
    const newPrices: Record<string, PricePreviewResponse['data']['details']['lineItems'][0]> = {}

    for (const tier of tiers) {
      const priceId = annual ? tier.priceId.year : tier.priceId.month
      try {
        const params: Parameters<typeof paddle.PricePreview>[0] = {
          items: [{ priceId, quantity: 1 }],
        }

        // Only pass country if we have it from server-side detection
        if (country) {
          params.address = { countryCode: country }
        }

        const response = await paddle.PricePreview(params)
        if (response.data.details.lineItems[0]) {
          newPrices[tier.name] = response.data.details.lineItems[0]
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${tier.name}:`, error)
      }
    }

    setPrices(newPrices)
    setLoading(false)
  }, [paddle, annual, country, tiers])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Open Paddle Checkout
  const handleCheckout = useCallback(
    (tier: Tier) => {
      if (!paddle) {
        console.error('Paddle not initialized')
        return
      }

      const priceId = annual ? tier.priceId.year : tier.priceId.month

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: 'overlay',
          variant: 'one-page',
          successUrl: `${window.location.origin}/welcome`,
        },
        ...(user?.primaryEmailAddress?.emailAddress && {
          customer: { email: user.primaryEmailAddress.emailAddress },
        }),
      })
    },
    [paddle, annual, user]
  )

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60 py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.03em] text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            FreelanceCRM
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/sign-in')}>
              Iniciar Sesion
            </Button>
            <Button size="sm" onClick={() => router.push('/sign-up')}>
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <section className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-primary mb-3">
              Precios
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-[-0.03em] mb-4">
              Planes simples y transparentes
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu negocio. Todos incluyen 7 dias de prueba gratis.
            </p>
          </div>

          <div className="flex justify-center items-center gap-3 mb-12">
            <span className={cn('text-sm font-medium', !annual ? 'text-foreground' : 'text-muted-foreground')}>
              Mensual
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                annual ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                  annual && 'translate-x-6'
                )}
              />
            </button>
            <span className={cn('text-sm font-medium', annual ? 'text-foreground' : 'text-muted-foreground')}>
              Anual
              <Badge variant="outline" className="ml-2 text-xs text-secondary border-secondary/30">
                -17%
              </Badge>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => {
              const priceData = prices[tier.name]
              const isPopular = tier.name === 'Pro'

              return (
                <div
                  key={tier.name}
                  className={cn(
                    'relative rounded-2xl border p-8 flex flex-col transition-all',
                    isPopular
                      ? 'border-primary bg-card shadow-lg shadow-primary/10 scale-[1.03]'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  )}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                      Mas Popular
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
                  <div className="mb-6">
                    {loading || !priceData ? (
                      <div className="h-12 w-32 bg-muted animate-pulse rounded" />
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold tracking-tight">
                          {priceData.formattedTotals.subtotal}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          /{annual ? 'ano' : 'mes'}
                        </span>
                        {priceData.formattedUnitTotals.tax && priceData.formattedUnitTotals.tax !== '$0.00' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{priceData.formattedUnitTotals.tax} impuestos
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <Button
                    className="mb-8"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleCheckout(tier)}
                    disabled={!paddle || loading}
                  >
                    {loading ? 'Cargando...' : 'Suscribirse'}
                  </Button>
                  <ul className="space-y-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <span>&copy; 2026 FreelanceCRM. Todos los derechos reservados.</span>
        </div>
      </footer>
    </>
  )
}
