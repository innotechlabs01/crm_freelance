'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { TrialBanner } from '@/components/layout/trial-banner'
import { useUser } from '@/hooks/use-user'
import { useInactivityTimeout } from '@/hooks/use-inactivity'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

const PAGE_KEYS = ['dashboard', 'clientes', 'cuentas-cobro', 'pagos', 'reportes', 'calendario', 'configuracion']

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, plan, subscription, permissions, isLoading } = useUser()
  useInactivityTimeout()

  const subStatus = subscription?.status || 'inactive'
  const isSubscriptionBlocked = subStatus === 'canceled' || subStatus === 'past_due' || subStatus === 'expired' || subStatus === 'paused'

  useEffect(() => {
    if (isSubscriptionBlocked && !pathname.includes('configuracion')) {
      router.replace('/configuracion')
    }
  }, [isSubscriptionBlocked, pathname, router])

  const currentPage =
    PAGE_KEYS.find((key) => pathname.includes(key)) || 'dashboard'

  const handleNavigate = useCallback((page: string) => {
    setMobileOpen(false)
    window.location.href = `/${page === 'dashboard' ? 'dashboard' : page}`
  }, [])

  const title = t(`nav.${currentPage.replace(/-/g, '_')}`)

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
        permissions={isSubscriptionBlocked ? [] : permissions}
        isLoading={isLoading}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          userEmail={user?.email ?? null}
        />
        <TrialBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
