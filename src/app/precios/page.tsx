'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, CheckCircle, Sun, Moon } from 'lucide-react'

const PRICING_PLANS = [
  {
    name: 'Gratuito',
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: 'Ideal para probar la plataforma.',
    features: [
      '1 cliente activo',
      '3 cuentas de cobro / mes',
      'Dashboard básico',
      'Historial de 3 meses',
      'PDF estándar con marca de agua',
    ],
    cta: 'Comenzar Gratis',
    featured: false,
  },
  {
    name: 'Profesional',
    monthlyPrice: 2499,
    yearlyPrice: 1999,
    desc: 'Para freelancers que trabajan de forma constante.',
    features: [
      'Clientes ilimitados',
      'Cuentas de cobro ilimitadas',
      'Sin marca de agua',
      'CRM financiero completo',
      'Registro de pagos',
      'Flujo de caja',
      'IA integrada',
      'Recordatorios automáticos',
      'Reportes avanzados',
      'Dashboard financiero completo',
    ],
    cta: 'Probar 14 días Gratis',
    featured: true,
  },
  {
    name: 'Empresarial',
    monthlyPrice: 7999,
    yearlyPrice: 6399,
    desc: 'Para equipos y agencias con múltiples colaboradores.',
    features: [
      'Todo Profesional',
      'Multiusuario',
      'Equipos',
      'Roles y permisos',
      'Marca blanca',
      'Dashboard ejecutivo',
    ],
    cta: 'Contactar Ventas',
    featured: false,
  },
]

function fmtPeso(centavos: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  }).format(centavos / 100)
}

export default function PreciosPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)

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
            <Button variant="ghost" size="sm" onClick={() => router.push('/auth/login')}>
              Iniciar Sesión
            </Button>
            <Button size="sm" onClick={() => router.push('/auth/login')}>
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
              Elige el plan que mejor se adapte a tu negocio. Cambia de plan cuando quieras.
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
                -20%
              </Badge>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => {
              const price = annual ? plan.yearlyPrice : plan.monthlyPrice
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative rounded-2xl border p-8 flex flex-col transition-all',
                    plan.featured
                      ? 'border-primary bg-card shadow-lg shadow-primary/10 scale-[1.03]'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  )}
                >
                  {plan.featured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                      Más Popular
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold tracking-tight">{fmtPeso(price)}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {price > 0 ? '/mes' : ''}
                    </span>
                    {annual && price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmtPeso(plan.monthlyPrice)} facturado anualmente
                      </p>
                    )}
                  </div>
                  <Button
                    className="mb-8"
                    variant={plan.featured ? 'default' : 'outline'}
                    onClick={() => router.push('/auth/login')}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
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
