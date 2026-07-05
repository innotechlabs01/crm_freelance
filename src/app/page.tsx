'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useUser as useClerkUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Zap,
  Mail,
  Download,
  Calendar,
  Sun,
  Moon,
  Menu,
  X,
  Star,
  Send,
  Sparkles,
  ShieldCheck,
  Bell,
  FileCheck,
  Target,
  AlertTriangle,
  Activity,
  Eye,
  PenTool,
  Phone,
  Share2,
  Globe,
  Briefcase,
  Code,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function useLandingTheme() {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  const toggle = useCallback(() => setTheme(dark ? 'light' : 'dark'), [dark, setTheme])
  return { dark, toggle }
}

// ---------------------------------------------------------------------------
// Scroll-reveal wrapper
// ---------------------------------------------------------------------------

function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { ref, isVisible } = useScrollAnimation(0.08)
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function StaggerChildren({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.06)
  const delays = [0, 80, 160, 240, 320, 400, 480, 560, 640]
  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? (children as React.ReactElement[]).map((child, i) => (
            <div
              key={i}
              className={cn(
                'transition-all duration-500 ease-out',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              )}
              style={{ transitionDelay: `${delays[i] || 0}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header (shared)
// ---------------------------------------------------------------------------

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <FadeUp>
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-primary mb-3">
          {label}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-[-0.03em] mb-4">
          {title}
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>
    </FadeUp>
  )
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { label: 'Solución', href: '#solucion' },
  { label: 'CRM', href: '#crm' },
  { label: 'Precios', href: '/precios' },
  { label: 'Testimonios', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

const BENEFITS = [
  {
    icon: Users,
    title: 'CRM de Clientes',
    desc: 'Gestiona clientes, empresas y contactos con todo su historial financiero, tributario y bancario.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: CreditCard,
    title: 'Control de Pagos',
    desc: 'Identifica quién te debe dinero y cuándo debe pagarte. No más cuentas perdidas ni clientes morosos.',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    icon: BarChart3,
    title: 'Flujo de Caja',
    desc: 'Visualiza ingresos diarios, semanales y mensuales con gráficos interactivos que muestran tu salud financiera.',
    color: 'bg-chart-5/10 text-chart-5',
  },
  {
    icon: FileText,
    title: 'Cuentas de Cobro',
    desc: 'Genera documentos profesionales en segundos con todos los datos fiscales y requisitos colombianos.',
    color: 'bg-chart-4/10 text-chart-4',
  },
  {
    icon: PenTool,
    title: 'IA Integrada',
    desc: 'Describe tu trabajo en lenguaje natural y la IA genera automáticamente el concepto, descripción y valor sugerido.',
    color: 'bg-chart-3/10 text-chart-3',
  },
  {
    icon: Bell,
    title: 'Recordatorios Automáticos',
    desc: 'Reduce la cartera vencida con seguimientos inteligentes por correo y WhatsApp. Automatizado y sin esfuerzo.',
    color: 'bg-destructive/10 text-destructive',
  },
]

const DEMO_STEPS = [
  { num: 1, label: 'Selecciona un cliente' },
  { num: 2, label: 'Describe el servicio' },
  { num: 3, label: 'IA genera la cuenta' },
  { num: 4, label: 'Descarga o envía' },
]

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

const TESTIMONIALS = [
  {
    stars: 5,
    text: '"Antes llevaba todo en Excel. Ahora sé exactamente cuánto me deben, quién me paga y cuándo. Me cambió la vida financiera."',
    name: 'Andrea Mejía',
    role: 'Diseñadora UX, Medellín',
    initials: 'AM',
    color: '#2563EB',
  },
  {
    stars: 5,
    text: '"Reduje el tiempo de generación de cuentas de cobro de 20 minutos a menos de 2. La IA me ahorra horas cada semana."',
    name: 'Carlos Restrepo',
    role: 'Desarrollador Web, Bogotá',
    initials: 'CR',
    color: '#10B981',
  },
  {
    stars: 5,
    text: '"Los recordatorios automáticos mejoraron mis cobros en un 40%. Mis clientes ahora pagan a tiempo porque el sistema no deja de recordarles."',
    name: 'Pedro González',
    role: 'Consultor Financiero, Ciudad de México',
    initials: 'PG',
    color: '#F59E0B',
  },
]

const FAQ_ITEMS = [
  {
    q: '¿Puedo usarlo gratis?',
    a: 'Sí. El plan gratuito incluye 1 cliente activo y 3 cuentas de cobro por mes, con dashboard básico e historial de 3 meses. Sin necesidad de tarjeta de crédito. Todos los planes de pago incluyen 14 días de prueba gratuita.',
  },
  {
    q: '¿Las cuentas de cobro son válidas en Colombia?',
    a: 'Sí. Nuestras cuentas de cobro cumplen con los requisitos de la DIAN y están validadas por contadores públicos. Incluyen NIT, régimen tributario, retenciones aplicables y datos bancarios.',
  },
  {
    q: '¿Puedo personalizar el PDF?',
    a: 'En los planes Profesional y Empresarial puedes personalizar el diseño del PDF con tu logo, colores corporativos y datos de la empresa. El plan Gratuito incluye una plantilla estándar profesional.',
  },
  {
    q: '¿Tiene integración con correo?',
    a: 'Sí. Puedes enviar cuentas de cobro directamente por correo desde la plataforma. También tenemos integración con Gmail, Outlook y correo corporativo. Los recordatorios automáticos también funcionan por correo.',
  },
  {
    q: '¿La IA genera automáticamente los conceptos?',
    a: 'Sí. Nuestra inteligencia artificial analiza tu descripción del trabajo y genera automáticamente el concepto, la descripción profesional y un valor sugerido basado en el mercado actual. Solo disponible en el plan Profesional.',
  },
]

const TIMELINE_ITEMS = [
  {
    day: 'Día 0',
    title: 'Cuenta enviada al cliente',
    desc: 'La cuenta de cobro se envía automáticamente por correo con copia a tu archivo.',
    color: 'bg-primary',
    actions: [],
  },
  {
    day: 'Día 7',
    title: 'Primer recordatorio automático',
    desc: 'El sistema envía un recordatorio cortés al cliente con el estado de la cuenta.',
    color: 'bg-secondary',
    actions: ['Correo', 'WhatsApp'],
  },
  {
    day: 'Día 15',
    title: 'Segundo recordatorio',
    desc: 'Recordatorio con tono más directo. Incluye opción de pago en línea.',
    color: 'bg-warning',
    actions: ['Correo', 'WhatsApp', 'Programar llamada'],
  },
  {
    day: 'Día 30',
    title: 'Cuenta marcada como vencida',
    desc: 'La cuenta pasa a estado vencido. Puedes generar un reporte para tu contador.',
    color: 'bg-destructive',
    actions: [],
  },
]

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  const { dark, toggle } = useLandingTheme()
  const { isSignedIn } = useClerkUser()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4',
        scrolled &&
          'py-2.5 bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-b border-border/60 shadow-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.03em] text-foreground">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          FreelanceCRM
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:rounded after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {!isSignedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => router.push("/auth/login")}
            >
              Iniciar Sesión
            </Button>
          )}
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => router.push(isSignedIn ? "/dashboard" : "/auth/login")}
          >
            {isSignedIn ? "Ir al Dashboard" : "Comenzar Gratis"}
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg p-6 flex flex-col gap-4 animate-slide">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => router.push("/auth/login")}
            >
              Iniciar Sesión
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => router.push("/auth/login")}
            >
              Comenzar Gratis
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  const router = useRouter()
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background glows */}
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full pointer-events-none -z-10" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1), transparent 70%)' }} />
      <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none -z-10" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <FadeUp>
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-[-0.04em] mb-6">
              Controla tus ingresos, clientes y pagos{' '}
              <span className="text-primary">desde un solo lugar</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              FreelanceCRM te ayuda a administrar clientes, generar cuentas de cobro, hacer
              seguimiento de pagos y visualizar tu flujo de caja en tiempo real.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                size="lg"
                className="text-base px-7 h-11"
                onClick={() => router.push("/auth/login")}
              >
                Comenzar Gratis
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-7 h-11"
                onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Demo
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['Sin tarjeta de crédito', '14 días gratis', 'Configuración <5 min'].map((t) => (
                <span key={t} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Right - Dashboard mockup */}
        <FadeUp delay={150}>
          <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden transform lg:perspective-[1200px] lg:rotate-y-[-3deg] lg:rotate-x-[1deg] transition-transform hover:rotate-y-[-1deg]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Dashboard — Resumen Financiero
              </span>
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white">
                F
              </div>
            </div>
            {/* Body */}
            <div className="p-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Facturado este mes', value: '$18.450.000', change: '+12.5%', up: true },
                  { label: 'Cobrado este mes', value: '$12.820.000', change: '+8.3%', up: true },
                  { label: 'Pendiente por cobrar', value: '$5.630.000', change: '+5.2%', up: false },
                  { label: 'Próximos venc.', value: '$3.150.000', change: '+3', up: true },
                ].map((kpi, i) => (
                  <div key={i} className="bg-muted/40 rounded-xl p-3.5 border border-border/60">
                    <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.04em] mb-1">
                      {kpi.label}
                    </div>
                    <div className="text-lg font-bold tracking-[-0.02em] flex items-center gap-2">
                      {kpi.value}
                      <span
                        className={cn(
                          'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                          kpi.up
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {kpi.change}
                      </span>
                    </div>
                    <div className="flex items-end gap-[2px] h-6 mt-2">
                      {[40, 65, 50, 75, 55, 85, 60].map((h, j) => (
                        <span
                          key={j}
                          className="w-[6px] rounded-t-[2px] bg-primary/40"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Bottom row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-2">
                    Flujo de Caja — Junio
                  </h4>
                  <div className="flex items-end gap-[3px] h-10">
                    {[65, 45, 75, 55, 85, 60, 90].map((h, j) => (
                      <div
                        key={j}
                        className="flex-1 rounded-t-[3px]"
                        style={{
                          height: `${h}%`,
                          background: j % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
                          opacity: 0.7,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-2">
                    Próximos Venc.
                  </h4>
                  {[
                    { name: 'Studio 3', date: 'Vence hoy', urgent: true },
                    { name: 'Mentoons', date: 'En 3 días', urgent: false },
                    { name: 'Buildco', date: 'En 7 días', urgent: false },
                  ].map((item, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between py-1.5 text-[13px] border-b border-border/40 last:border-0"
                    >
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className={cn('font-semibold', item.urgent && 'text-warning')}>
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Problem / Solution
// ---------------------------------------------------------------------------

function ProblemSolution() {
  return (
    <section id="solucion" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="El problema"
          title="Tu negocio merece más que Excel y Word"
          subtitle="Si aún gestionas tu negocio freelance con hojas de cálculo, estás perdiendo tiempo, dinero y tranquilidad."
        />
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Problems */}
          <FadeUp>
            <div className="rounded-2xl p-8 border border-border bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="flex items-center gap-2 mb-6 text-destructive text-xs font-bold uppercase tracking-[0.08em]">
                <AlertTriangle className="w-5 h-5" />
                ¿Te pasa esto?
              </div>
              {[
                'No sabes cuánto te deben',
                'No sabes cuánto has cobrado este mes',
                'Pierdes tiempo generando documentos',
                'No tienes seguimiento de pagos',
                'No tienes proyección financiera',
              ].map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0 text-sm text-muted-foreground"
                >
                  <X className="w-[18px] h-[18px] text-destructive flex-shrink-0 mt-0.5" />
                  {p}
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Solutions */}
          <FadeUp delay={150}>
            <div className="rounded-2xl p-8 border border-border bg-gradient-to-br from-secondary/5 to-transparent">
              <div className="flex items-center gap-2 mb-6 text-secondary text-xs font-bold uppercase tracking-[0.08em]">
                <CheckCircle className="w-5 h-5" />
                Con FreelanceCRM
              </div>
              {[
                'Todo centralizado en una plataforma',
                'Dashboard financiero en tiempo real',
                'Seguimiento automático de pagos',
                'Proyección de ingresos',
                'Recordatorios inteligentes',
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0 text-sm text-muted-foreground"
                >
                  <CheckCircle className="w-[18px] h-[18px] text-secondary flex-shrink-0 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------

function BenefitsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Solución"
          title="Todo tu negocio freelance en una sola plataforma"
          subtitle="Administra clientes, controla pagos, visualiza tu flujo de caja y genera documentos profesionales."
        />
        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group relative bg-card border border-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-transparent overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-5', b.color)}>
                <b.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-[-0.02em] mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Interactive Demo
// ---------------------------------------------------------------------------

function InteractiveDemo() {
  const [step, setStep] = useState(0)

  return (
    <section id="demo" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Demo interactiva"
          title="Así funciona FreelanceCRM"
          subtitle="Cuatro pasos para generar tu primera cuenta de cobro profesional."
        />

        {/* Step tabs */}
        <FadeUp>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-0 mt-10 mb-10">
            {DEMO_STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => setStep(i)}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all',
                    step === i
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      step === i ? 'bg-primary text-white' : 'bg-border text-muted-foreground'
                    )}
                  >
                    {s.num}
                  </span>
                  {s.label}
                </button>
                {i < DEMO_STEPS.length - 1 && (
                  <div className="hidden sm:block w-6 h-[1px] bg-border flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Demo content */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg animate-fade">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.02em] mb-3">Paso 1: Selecciona un cliente</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Elige entre tus clientes registrados o agrega uno nuevo en segundos. FreelanceCRM
                  guarda toda la información fiscal y de contacto para que no tengas que escribirla cada vez.
                </p>
                <p className="text-xs text-muted-foreground">
                  Datos disponibles: nombre, NIT, dirección, correo, teléfono, datos bancarios.
                </p>
              </div>
              <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-border flex flex-col gap-3">
                {[
                  { name: 'María López', company: 'Studio 3 Diseño', color: '#2563EB', init: 'ML', selected: true },
                  { name: 'Carlos Ruiz', company: 'Mentoons SAS', color: '#10B981', init: 'CR', selected: false },
                  { name: 'Ana García', company: 'Buildco Ltda', color: '#F59E0B', init: 'AG', selected: false },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary transition-colors cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.init}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.company}</div>
                    </div>
                    {c.selected && <CheckCircle className="w-4 h-4 text-secondary ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.02em] mb-3">Paso 2: Describe el servicio prestado</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Escribe de forma natural qué trabajo realizaste. No necesitas redactar documentos formales — nosotros nos encargamos de eso.
                </p>
                <div className="bg-muted/30 border border-border rounded-xl p-4">
                  <div className="text-[11px] text-muted-foreground font-semibold mb-2">
                    Describe el trabajo:
                  </div>
                  <div className="text-sm text-muted-foreground py-2 border-b border-border/40 italic">
                    &quot;Desarrollé una aplicación móvil para un restaurante durante el mes de mayo.&quot;
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-border">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-3">
                  Campos que se llenarán:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Concepto', value: 'Automático', color: 'text-primary' },
                    { label: 'Descripción', value: 'Profesional', color: 'text-secondary' },
                    { label: 'Valor Sugerido', value: 'Inteligente', color: 'text-warning' },
                    { label: 'Retenciones', value: 'Calculadas', color: '' },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="p-3 bg-card border border-border rounded-lg text-center"
                    >
                      <div className="text-[11px] text-muted-foreground">{f.label}</div>
                      <div className={cn('text-sm font-semibold mt-1', f.color)}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.02em] mb-3">Paso 3: IA genera automáticamente la cuenta</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nuestra inteligencia artificial analiza tu descripción y genera una cuenta de cobro profesional completa con todos los datos fiscales requeridos.
                </p>
              </div>
              <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-border">
                <div className="bg-card border border-border rounded-xl p-6">
                  {/* SVG illustration */}
                  <svg width="100%" height="160" viewBox="0 0 400 160">
                    <rect width="400" height="160" rx="12" fill="transparent" />
                    <line x1="20" y1="30" x2="380" y2="30" stroke="var(--border)" strokeDasharray="4" />
                    <text x="30" y="22" fontSize="10" fill="currentColor" opacity="0.5" fontWeight="600">
                      CONCEPTO GENERADO
                    </text>
                    <text x="30" y="50" fontSize="18" fill="var(--primary)" fontWeight="700">
                      Desarrollo App Móvil - Mayo
                    </text>
                    <text x="30" y="72" fontSize="12" fill="currentColor" opacity="0.6">
                      Aplicación móvil para restaurante
                    </text>
                    <text x="30" y="88" fontSize="12" fill="currentColor" opacity="0.6">
                      incluyendo menú digital, pedidos y pagos.
                    </text>
                    <line x1="20" y1="100" x2="380" y2="100" stroke="var(--border)" strokeDasharray="4" />
                    <text x="30" y="118" fontSize="11" fill="currentColor" opacity="0.5">
                      Valor sugerido
                    </text>
                    <text x="30" y="138" fontSize="20" fill="var(--secondary)" fontWeight="800">
                      $4.500.000
                    </text>
                    <rect x="280" y="110" width="80" height="30" rx="6" fill="var(--primary)" />
                    <text
                      x="320"
                      y="130"
                      fontSize="11"
                      fill="#fff"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      Aceptar
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.02em] mb-3">Paso 4: Descarga PDF o envía por correo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tu cuenta de cobro está lista. Descárgala como PDF profesional o envíala directamente por correo a tu cliente.
                </p>
              </div>
              <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-border">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Download, label: 'Descargar PDF', color: 'text-primary border-primary bg-primary/5' },
                    { icon: Mail, label: 'Enviar por Correo', color: 'text-secondary border-border' },
                    { icon: Share2, label: 'Enlace de Pago', color: 'text-foreground border-border' },
                    { icon: Phone, label: 'WhatsApp', color: 'text-foreground border-border' },
                  ].map((a, j) => (
                    <div
                      key={j}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 border-2 rounded-xl text-center cursor-pointer transition-all hover:border-primary bg-card',
                        a.color
                      )}
                    >
                      <a.icon className="w-6 h-6" />
                      <span className="text-xs font-semibold">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Invoice Mockup
// ---------------------------------------------------------------------------

function InvoiceMockup() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Cuenta de Cobro"
          title="Documentos profesionales con todos los requisitos fiscales"
          subtitle="Cada cuenta de cobro incluye los datos necesarios para facturación en Colombia."
        />
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center mt-12">
          <FadeUp>
            <div className="bg-card rounded-2xl p-8 shadow-xl text-card-foreground text-[13px]">
              {/* Invoice header */}
                  <div className="flex justify-between pb-4 mb-6 border-b-2 border-border">
                <div>
                  <h4 className="text-xl font-extrabold text-primary">FreelanceCRM</h4>
                  <div className="text-[11px] text-muted-foreground">Cuenta de Cobro</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-primary">#0012</div>
                  <div className="text-xs text-muted-foreground">15 de Junio, 2026</div>
                </div>
              </div>
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                <div>
                  <strong className="block text-muted-foreground font-medium mb-1 uppercase tracking-[0.04em]">Cliente</strong>
                  María López<br />Studio 3 Diseño<br />NIT: 123.456.789-0
                </div>
                <div>
                  <strong className="block text-muted-foreground font-medium mb-1 uppercase tracking-[0.04em]">Dirección</strong>
                  Calle 45 #23-12<br />Bogotá, Colombia<br />maria@studio3.com
                </div>
              </div>
              {/* Table */}
              <table className="w-full mb-5 text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 text-[11px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border">
                      Concepto
                    </th>
                    <th className="text-left py-2 text-[11px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border">
                      Cant.
                    </th>
                    <th className="text-left py-2 text-[11px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Desarrollo App Móvil - Mayo', '1', '$3.800.000'],
                    ['Diseño UI/UX - Sprint 2', '1', '$1.200.000'],
                    ['Hosting mensual', '1', '$150.000'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2">{row[0]}</td>
                      <td className="py-2">{row[1]}</td>
                      <td className="py-2">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Total */}
              <div className="text-right pt-3 border-t-2 border-border text-sm font-bold">
                Total: <span className="text-xl text-secondary">$5.150.000</span>
              </div>
              {/* Bank info */}
              <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                <span><strong>Banco:</strong> Bancolombia</span>
                <span><strong>Tipo:</strong> Cuenta de Ahorros</span>
                <span><strong>Número:</strong> 123-456789-01</span>
                <span><strong>Titular:</strong> FreelanceCRM SAS</span>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={150}>
            <div className="flex flex-col gap-4">
              {[
                { icon: Download, title: 'PDF profesional', desc: 'Documentos listos para imprimir y enviar con diseño corporativo.' },
                { icon: Zap, title: 'Descarga inmediata', desc: 'Genera y descarga en segundos. Sin esperas ni procesos complicados.' },
                { icon: ShieldCheck, title: 'Datos bancarios incluidos', desc: 'Tu información de pago aparece automáticamente en cada documento.' },
                { icon: Target, title: 'Compatible con Colombia', desc: 'Validado con contadores públicos. Cumple requisitos DIAN y retenciones.' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <f.icon className="w-[22px] h-[22px] text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// CRM Features
// ---------------------------------------------------------------------------

function CRMFeatures() {
  return (
    <section id="crm" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="CRM Financiero"
          title="Tu dinero siempre bajo control"
          subtitle="Visualiza tu salud financiera con métricas claras y herramientas de seguimiento."
        />
        <div className="grid lg:grid-cols-2 gap-10 mt-12">
          {/* Left: KPIs + Chart */}
          <FadeUp>
            <div className="space-y-4">
              {/* KPI grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Facturado Hoy', val: '$2.450.000', change: '+12%', positive: true },
                  { label: 'Facturado este Mes', val: '$18.450.000', change: '+15%', positive: true },
                  { label: 'Cobrado este Mes', val: '$12.820.000', change: '+8%', positive: true },
                  { label: 'Pendiente por Cobrar', val: '$5.630.000', change: '+5%', positive: false },
                ].map((kpi, i) => (
                  <div key={i} className="bg-muted/30 border border-border/60 rounded-xl p-4">
                    <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.04em] mb-1.5">
                      {kpi.label}
                    </div>
                    <div className="text-lg font-bold tracking-[-0.02em] flex items-center gap-2">
                      {kpi.val}
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          kpi.positive ? 'text-secondary' : 'text-warning'
                        )}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cashflow chart */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-sm font-semibold mb-4">Flujo de Caja — Últimos 6 meses</h4>
                <div className="flex items-end gap-2 h-[160px] pt-2">
                  {[
                    { fact: 65, cob: 55, pen: 35 },
                    { fact: 75, cob: 60, pen: 40 },
                    { fact: 55, cob: 70, pen: 30 },
                    { fact: 80, cob: 65, pen: 45 },
                    { fact: 70, cob: 75, pen: 35 },
                    { fact: 90, cob: 80, pen: 50 },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-[3px]" style={{ height: 140 }}>
                        <div className="w-3 bg-primary rounded-t" style={{ height: `${bar.fact}%` }} />
                        <div className="w-3 bg-secondary rounded-t" style={{ height: `${bar.cob}%` }} />
                        <div className="w-3 bg-muted-foreground/30 rounded-t" style={{ height: `${bar.pen}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Facturado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-secondary" /> Cobrado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" /> Pendiente
                  </span>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Right: Chart + Kanban */}
          <FadeUp delay={150}>
            <div className="space-y-4">
              {/* Line chart */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-sm font-semibold mb-4">Ingresos Mensuales</h4>
                <svg width="100%" height="160" viewBox="0 0 400 160">
                  <polyline
                    points="0,150 66,120 133,140 200,80 266,100 333,50 400,60"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="0,150 66,120 133,140 200,80 266,100 333,50 400,60 400,160 0,160"
                    fill="var(--primary)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <circle cx="200" cy="80" r="5" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
                  <circle cx="333" cy="50" r="5" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
                  <text x="333" y="40" fontSize="10" fill="currentColor" opacity="0.6" textAnchor="middle">
                    $8.2M
                  </text>
                </svg>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Kanban */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    title: 'Pendiente',
                    count: 3,
                    items: [
                      { name: 'María López', amount: '$850.00', date: 'Vence 20 Jun', color: 'text-primary' },
                      { name: 'Carlos Ruiz', amount: '$1,200.00', date: 'Vence 25 Jun', color: 'text-primary' },
                    ],
                  },
                  {
                    title: 'Enviada',
                    count: 2,
                    items: [
                      { name: 'Ana García', amount: '$400.00', date: 'Enviada 10 Jun', color: 'text-primary' },
                    ],
                  },
                  {
                    title: 'Por Vencer',
                    count: 1,
                    items: [
                      { name: 'Studio 3', amount: '$890.00', date: 'Vence mañana', color: 'text-warning' },
                    ],
                  },
                  {
                    title: 'Pagada',
                    count: 4,
                    items: [
                      { name: 'Mentoons', amount: '$1,500.00', date: 'Pagado 01 Jun', color: 'text-secondary' },
                      { name: 'Buildco', amount: '$650.00', date: 'Pagado 28 May', color: 'text-secondary' },
                    ],
                  },
                ].map((col) => (
                  <div key={col.title} className="rounded-xl p-3 bg-muted/20 border border-border/60">
                    <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-3 flex items-center justify-between">
                      {col.title}
                      <span className="text-[10px] bg-border px-2 py-0.5 rounded-full text-muted-foreground">
                        {col.count}
                      </span>
                    </h5>
                    {col.items.map((item, j) => (
                      <div
                        key={j}
                        className="bg-card border border-border rounded-lg p-2.5 mb-2 last:mb-0 shadow-sm"
                      >
                        <div className="text-xs font-semibold mb-1">{item.name}</div>
                        <div className={cn('text-[13px] font-bold', item.color)}>{item.amount}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{item.date}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// AI Section
// ---------------------------------------------------------------------------

function AISection() {
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'Desarrollé una aplicación móvil para un restaurante durante el mes de mayo.',
    },
    {
      role: 'assistant',
      text: 'Desarrollo App Móvil - Mayo',
      desc: 'Aplicación móvil para restaurante con menú digital, sistema de pedidos y pasarela de pagos. Incluye panel administrativo y notificaciones push.',
      value: '$4.500.000',
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    // Simulate AI response
    setTimeout(() => {
      const concepts = ['Desarrollo Web', 'App Móvil', 'Consultoría', 'Diseño UI/UX', 'Marketing Digital']
      const concept = concepts[Math.floor(Math.random() * concepts.length)]
      const vals = ['$2.800.000', '$4.500.000', '$1.200.000', '$3.200.000', '$5.000.000']
      const val = vals[Math.floor(Math.random() * vals.length)]
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: concept,
          desc: text,
          value: val,
        },
      ])
    }, 1200)
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Inteligencia Artificial"
          title="Tu asistente financiero con IA"
          subtitle="Describe el trabajo que realizaste y la IA genera automáticamente el concepto, descripción profesional y valor sugerido."
        />
        <div className="grid lg:grid-cols-2 gap-12 items-center mt-12">
          {/* Chat */}
          <FadeUp>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-muted/20">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-xs font-semibold">Asistente IA — FreelanceCRM</span>
              </div>
              <div className="p-5 flex flex-col gap-3 min-h-[300px] max-h-[400px] overflow-y-auto">
                {messages.map((m, i) =>
                  m.role === 'user' ? (
                    <div
                      key={i}
                      className="max-w-[85%] self-end bg-primary text-white px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed animate-slide"
                    >
                      {m.text}
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="max-w-[85%] self-start bg-muted/40 border border-border/60 px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed animate-slide"
                    >
                      <strong className="text-primary">Concepto generado:</strong> {m.text}
                      <br />
                      <strong>Descripción:</strong> {m.desc}
                      <br />
                      <strong>
                        Valor sugerido:{' '}
                        <strong className="text-secondary">{m.value}</strong>
                      </strong>
                      <br />
                      📄 Cuenta de cobro lista para exportar.
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-2 p-3 border-t border-border bg-muted/10">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe el trabajo realizado..."
                  className="flex-1 px-4 py-2.5 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <Button onClick={handleSend} size="sm">
                  <Send className="w-3.5 h-3.5" />
                  Generar
                </Button>
              </div>
            </div>
          </FadeUp>

          {/* Features */}
          <FadeUp delay={150}>
            <div className="flex flex-col gap-4">
              {[
                { icon: PenTool, title: 'Descripción natural', desc: 'Escribe como hablas. La IA entiende el contexto y lo convierte en un concepto profesional.' },
                { icon: Sparkles, title: 'Valor sugerido inteligente', desc: 'Basado en el tipo de servicio, duración y complejidad del trabajo descrito.' },
                { icon: FileCheck, title: 'Cuenta lista para exportar', desc: 'Con datos fiscales, retenciones y formato profesional. Descarga en PDF en un clic.' },
                { icon: Activity, title: 'Aprende de tu estilo', desc: 'La IA se adapta a la forma en que describes tus servicios y mejora con cada uso.' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <f.icon className="w-[22px] h-[22px] text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Payment Registration
// ---------------------------------------------------------------------------

function PaymentRegistration() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Registro de Pagos"
          title="Cada pago registrado actualiza todo tu negocio"
          subtitle="Registra pagos y automáticamente se actualiza el dashboard, flujo de caja y estado de cuentas."
        />
        <div className="grid lg:grid-cols-2 gap-12 mt-12">
          {/* Form */}
          <FadeUp>
            <Card className="p-7">
              <h4 className="text-base font-bold mb-5">Registrar Pago</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente</label>
                  <select className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary">
                    <option>María López — Studio 3</option>
                    <option>Carlos Ruiz — Mentoons</option>
                    <option>Ana García — Buildco</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cuenta de Cobro</label>
                  <select className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary">
                    <option>#0012 — $850.000</option>
                    <option>#0011 — $1.200.000</option>
                    <option>#0010 — $400.000</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Fecha de pago</label>
                  <input
                    type="date"
                    defaultValue="2026-06-15"
                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Método de pago</label>
                  <select className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary">
                    <option>Transferencia bancaria</option>
                    <option>Nequi</option>
                    <option>DaviPlata</option>
                    <option>Efectivo</option>
                    <option>Tarjeta de crédito</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valor recibido</label>
                  <input
                    type="text"
                    defaultValue="$850.000"
                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Referencia</label>
                  <input
                    type="text"
                    placeholder="Núm. transacción o consignación"
                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <Button className="w-full mt-5 bg-secondary hover:bg-secondary/80 text-secondary-foreground" size="lg">
                <CheckCircle className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
            </Card>
          </FadeUp>

          {/* Info */}
          <FadeUp delay={100}>
            <Card className="p-5 bg-muted/20">
              <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-4">
                <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                  <CheckCircle className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">Al registrar un pago</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    ✓ Dashboard actualizado • Flujo de caja • Cuenta marcada como pagada
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                <p>Al registrar un pago, FreelanceCRM automáticamente:</p>
                <p>• Actualiza las métricas del dashboard en tiempo real</p>
                <p>• Refleja el ingreso en el flujo de caja</p>
                <p>• Marca la cuenta de cobro como pagada</p>
                <p>• Envía notificación de confirmación al cliente</p>
                <p>• Actualiza el historial financiero del cliente</p>
              </div>
            </Card>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Financial Intelligence
// ---------------------------------------------------------------------------

function FinancialIntelligence() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Inteligencia Financiera"
          title="Decisiones basadas en datos reales"
          subtitle="Widgets inteligentes que te muestran la salud financiera de tu negocio freelance."
        />
        <StaggerChildren className="grid md:grid-cols-3 gap-6 mt-12">
          {/* Top invoicing */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">Clientes que más facturan</div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { initials: 'PM', name: 'Pedro Martínez', amount: '$6,800.00', color: '#2563EB' },
                { initials: 'ML', name: 'María López', amount: '$5,200.00', color: '#10B981' },
                { initials: 'CR', name: 'Carlos Ruiz', amount: '$3,200.00', color: '#F59E0B' },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </div>
                  <span className="flex-1 text-[13px]">{c.name}</span>
                  <span className="text-sm font-bold">{c.amount}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Late payers */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">Clientes con pagos atrasados</div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { initials: 'PM', name: 'Pedro Martínez', days: '75 días', color: '#EF4444' },
                { initials: 'CR', name: 'Carlos Ruiz', days: '18 días', color: '#F59E0B' },
                { initials: 'ML', name: 'María López', days: '5 días', color: '#F59E0B' },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </div>
                  <span className="flex-1 text-[13px]">{c.name}</span>
                  <span
                    className={cn(
                      'text-[13px] font-semibold',
                      c.color === '#EF4444' ? 'text-destructive' : 'text-warning'
                    )}
                  >
                    {c.days}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projected income */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">Ingresos proyectados</div>
            </div>
            <div className="text-2xl font-extrabold tracking-[-0.03em] text-secondary mb-2">$12.8M</div>
            <div className="text-[13px] text-muted-foreground mb-4">Próximos 30 días</div>
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-[11px] text-muted-foreground mb-1">Promedio mensual</div>
                <div className="text-base font-bold">$8.2M</div>
              </div>
              <div className="flex-1 p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-[11px] text-muted-foreground mb-1">Tasa de cobro</div>
                <div className="text-base font-bold text-secondary">78%</div>
              </div>
            </div>
          </Card>
        </StaggerChildren>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Reminders Timeline
// ---------------------------------------------------------------------------

function RemindersTimeline() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <SectionHeader
          label="Recordatorios"
          title="Nunca olvides cobrar"
          subtitle="Seguimiento automático inteligente que reduce la cartera vencida."
        />
        <FadeUp>
          <div className="relative pl-10 mt-10">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-secondary via-warning to-destructive rounded-full" />
            {TIMELINE_ITEMS.map((item, i) => (
              <div key={i} className="relative pb-8 last:pb-0 pl-6">
                {/* Dot */}
                <div
                  className={cn(
                    'absolute -left-8 top-1 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white z-10',
                    item.color
                  )}
                >
                  {i + 1}
                </div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-1">
                  {item.day}
                </div>
                <div className="text-base font-semibold mb-1">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
                {item.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {item.actions.map((a) => (
                      <Badge key={a} variant="outline" className="text-[11px] cursor-pointer">
                        {a === 'Correo' ? <Mail className="w-3 h-3 mr-1" /> : a === 'WhatsApp' ? <Phone className="w-3 h-3 mr-1" /> : <Calendar className="w-3 h-3 mr-1" />}
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const router = useRouter()

  const fmtPeso = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100)

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          label="Planes"
          title="Precios claros, sin sorpresas"
          subtitle="Elige el plan que se ajuste a tu volumen de trabajo. Todos incluyen 14 días de prueba."
        />

        {/* Toggle */}
        <FadeUp>
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={cn('text-sm font-medium', !annual ? 'text-foreground' : 'text-muted-foreground')}>
              Mensual
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'w-12 h-6 rounded-full transition-all relative flex-shrink-0',
                annual ? 'bg-primary' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-all',
                  annual ? 'left-[25px]' : 'left-[3px]'
                )}
              />
            </button>
            <span className={cn('text-sm font-medium', annual ? 'text-foreground' : 'text-muted-foreground')}>
              Anual{' '}
              <span className="text-xs text-primary font-semibold">-20%</span>
            </span>
          </div>
        </FadeUp>

        <StaggerChildren className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative bg-card border rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                plan.featured
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-[0_0_0_1px_var(--primary)] shadow-lg'
                  : 'border-border'
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                  Más Popular
                </div>
              )}
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-2">
                {plan.name}
              </div>
              <div className="text-4xl font-extrabold tracking-[-0.03em] mb-1 flex items-baseline gap-1">
                {annual ? fmtPeso(plan.yearlyPrice) : fmtPeso(plan.monthlyPrice)}
                <span className="text-base font-medium text-muted-foreground tracking-normal">
                  /mes
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-6">{plan.desc}</div>
              <ul className="space-y-3 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.featured ? 'default' : 'outline'}
                className="w-full justify-center"
                onClick={() => router.push("/auth/login")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Testimonios"
          title="Lo que dicen nuestros usuarios"
          subtitle="Más de 2,000 freelancers en Latinoamérica ya confían en FreelanceCRM."
        />
        <StaggerChildren className="grid md:grid-cols-3 gap-6 mt-12">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-warning" fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic mb-5">{t.text}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="max-w-3xl mx-auto px-6">
        <SectionHeader
          label="FAQ"
          title="Preguntas frecuentes"
          subtitle="Todo lo que necesitas saber antes de empezar."
        />
        <FadeUp>
          <Accordion className="mt-10">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-base font-semibold py-5 hover:text-primary transition-colors">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground leading-relaxed pb-3">{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeUp>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

function CTASection() {
  const router = useRouter()
  return (
    <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary), #1D4ED8)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08), transparent 50%)' }} />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <FadeUp>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.03em] mb-4">
            Deja de administrar tu negocio con hojas de cálculo
          </h2>
        </FadeUp>
        <FadeUp delay={100}>
          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-lg mx-auto">
            Controla clientes, ingresos, pagos y flujo de caja desde una sola plataforma.
          </p>
        </FadeUp>
        <FadeUp delay={200}>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 text-base px-8 h-12"
              onClick={() => router.push("/auth/login")}
            >
              Comenzar Gratis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 text-base px-8 h-12"
              onClick={() => router.push("/auth/login")}
            >
              Solicitar Demo
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.03em] text-foreground mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-3.5 h-3.5 text-white" />
              </div>
              FreelanceCRM
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              La plataforma financiera inteligente para freelancers en Latinoamérica. Genera cuentas de cobro, administra clientes y controla tus ingresos.
            </p>
          </div>
          {/* Producto */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-4">
              Producto
            </h4>
            {[
              { label: 'Características', href: '/precios' },
              { label: 'Precios', href: '/precios' },
              { label: 'Integraciones', href: '/precios' },
              { label: 'API', href: '/precios' },
              { label: 'Blog', href: '/precios' },
            ].map((l) => (
              <a key={l.label} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          {/* Compañía */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-4">
              Compañía
            </h4>
            {[
              { label: 'Sobre nosotros', href: '/precios' },
              { label: 'Política de privacidad', href: '/privacidad' },
              { label: 'Términos y condiciones', href: '/terminos' },
              { label: 'Política de reembolso', href: '/reembolsos' },
              { label: 'Contacto', href: '/precios' },
            ].map((l) => (
              <a key={l.label} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          {/* Soporte */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-4">
              Soporte
            </h4>
            {['Centro de ayuda', 'Documentación', 'Estado del servicio', 'Reportar bug'].map((l) => (
              <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <span>© 2026 FreelanceCRM. Todos los derechos reservados.</span>
          <div className="flex gap-3">
            {[
              { icon: Globe, label: 'Twitter' },
              { icon: Briefcase, label: 'LinkedIn' },
              { icon: Code, label: 'GitHub' },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all"
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolution />
        <BenefitsSection />
        <InteractiveDemo />
        <InvoiceMockup />
        <CRMFeatures />
        <AISection />
        <PaymentRegistration />
        <FinancialIntelligence />
        <RemindersTimeline />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
