'use client'

import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'clientes', label: 'Clientes', icon: Users, href: '/clientes' },
  {
    id: 'cuentas-cobro',
    label: 'Cuentas de Cobro',
    icon: FileText,
    href: '/cuentas-cobro',
  },
  { id: 'pagos', label: 'Pagos', icon: CreditCard, href: '/pagos' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, href: '/reportes' },
  {
    id: 'calendario',
    label: 'Calendario',
    icon: Calendar,
    href: '/calendario',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    href: '/configuracion',
  },
]

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  userEmail?: string | null
  planName?: string | null
  permissions?: string[]
}

function getPlanBadge(planName?: string | null) {
  if (!planName) return { label: 'PRO', className: '' }
  switch (planName.toLowerCase()) {
    case 'free':
      return { label: 'FREE', className: 'bg-muted text-muted-foreground border-border' }
    case 'professional':
      return { label: 'PRO', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'enterprise':
      return { label: 'ENT', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' }
    default:
      return { label: 'PRO', className: '' }
  }
}

function getInitials(email?: string | null): string {
  if (!email) return '??'
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

export function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  userEmail,
  planName,
  permissions = [],
}: SidebarProps) {
  const planBadge = getPlanBadge(planName)
  const initial = getInitials(userEmail)

  const visibleNavItems = navItems.filter((item) => {
    if (item.id === 'reportes' && !permissions.includes('advanced_reports')) {
      return false
    }
    return true
  })
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out',
          'lg:sticky lg:top-0 lg:z-30 lg:h-screen',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-sidebar-border px-4',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary">
                <span className="text-xs font-bold text-primary-foreground">
                  FC
                </span>
              </div>
              <span className="text-sm font-semibold">Freelance CRM</span>
              <Badge
                variant="default"
                className={cn(
                  'h-4 px-1 text-[10px] leading-none',
                  planBadge.className,
                )}
              >
                {planBadge.label}
              </Badge>
            </div>
          )}
          {collapsed && (
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                FC
              </span>
            </div>
          )}
          {mobileOpen && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onMobileClose}
              className="lg:hidden"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col gap-0.5 px-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      'group relative flex w-full items-center rounded-lg text-sm transition-colors',
                      collapsed
                        ? 'justify-center px-0 py-2.5'
                        : 'gap-3 px-3 py-2',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                    )}
                    <Icon className="size-5 shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User */}
        <div
          className={cn(
            'flex items-center border-t border-sidebar-border p-3',
            collapsed ? 'justify-center' : 'gap-3',
          )}
        >
          <Avatar size="sm">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {userEmail ?? 'Sin sesión'}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block border-t border-sidebar-border p-2">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
