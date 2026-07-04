'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { TrialBanner } from '@/components/layout/trial-banner'
import { useUser } from '@/hooks/use-user'

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  'cuentas-cobro': 'Cuentas de Cobro',
  pagos: 'Pagos',
  reportes: 'Reportes',
  calendario: 'Calendario',
  configuracion: 'Configuración',
}

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, plan, permissions } = useUser()

  const currentPage =
    Object.keys(pageTitles).find((key) => pathname.includes(key)) || 'dashboard'

  const handleNavigate = useCallback((page: string) => {
    setMobileOpen(false)
    window.location.href = `/${page === 'dashboard' ? '' : page}`
  }, [])

  const title = pageTitles[currentPage] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userEmail={user?.email ?? null}
        planName={plan?.display_name ?? null}
        permissions={permissions}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <TrialBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
