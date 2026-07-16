'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function WelcomeContent() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const timer = setTimeout(() => setShowContent(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoaded, isSignedIn])

  const isFromCheckout = searchParams.get('paddle_checkout_id') || searchParams.get('subscription_id')

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center">
          <div className={cn(
            'inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6',
            showContent && 'animate-in zoom-in duration-500'
          )}>
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>

          <h1 className={cn(
            'text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-4',
            showContent && 'animate-in slide-in-from-y-4 duration-500'
          )}>
            {isFromCheckout ? '¡Suscripción activada!' : 'Bienvenido a FreelanceCRM'}
          </h1>

          <p className={cn(
            'text-lg text-muted-foreground mb-8 max-w-md mx-auto',
            showContent && 'animate-in slide-in-from-y-4 duration-500 delay-100'
          )}>
            {isFromCheckout
              ? 'Tu suscripción se ha configurado correctamente. Ya tienes acceso a todas las funciones de tu plan.'
              : 'Tu cuenta está lista para empezar a gestionar tus clientes y facturas.'}
          </p>

          <div className={cn(
            'flex flex-col sm:flex-row gap-4 justify-center',
            showContent && 'animate-in slide-in-from-y-4 duration-500 delay-200'
          )}>
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Ir al Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/precios">
              <Button size="lg" variant="outline">
                Ver Planes
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
}