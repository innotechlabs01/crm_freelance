'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Bot,
  Activity,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const sidebarSections = [
  {
    label: 'Metrics',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp, href: '/admin' },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'usuarios', label: 'Users', icon: Users, href: '/admin/usuarios' },
      { id: 'suscripciones', label: 'Subscriptions', icon: CreditCard, href: '/admin/suscripciones' },
      { id: 'tickets', label: 'Tickets', icon: MessageSquare, href: '/admin/tickets' },
      { id: 'incidentes', label: 'Incidents', icon: AlertTriangle, href: '/admin/incidentes' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'automation', label: 'Automation', icon: Bot, href: '/admin/sistema' },
      { id: 'system', label: 'Health', icon: Activity, href: '/admin/sistema' },
      { id: 'config', label: 'Configuration', icon: Settings, href: '/admin/sistema' },
    ],
  },
]

function getPageId(pathname: string): string {
  if (pathname.startsWith('/admin/usuarios')) return 'usuarios'
  if (pathname.startsWith('/admin/suscripciones')) return 'suscripciones'
  if (pathname.startsWith('/admin/tickets')) return 'tickets'
  if (pathname.startsWith('/admin/incidentes')) return 'incidentes'
  if (pathname.startsWith('/admin/sistema')) return 'system'
  return 'dashboard'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentId = getPageId(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-border bg-sidebar',
              'lg:sticky lg:top-0 lg:z-30 lg:h-screen',
              mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
              'transition-transform duration-200',
            )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-sidebar-foreground">FreelanceCRM</span>
            <span className="text-[10px] font-medium tracking-wider text-sidebar-primary uppercase">
              Mission Control
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {sidebarSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentId === item.id
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                        )}
                        <Icon className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                OP
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                Operator One
              </p>
              <p className="truncate text-xs text-muted-foreground">
                ops@freelancecrm.co
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-2 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="text-xs font-medium text-muted-foreground">System Operational</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">v2.4.1</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
