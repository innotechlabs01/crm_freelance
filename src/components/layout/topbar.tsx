'use client'

import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  title: string
  onMenuClick: () => void
  userEmail?: string | null
}

function getInitials(email?: string | null): string {
  if (!email) return '??'
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

export function Topbar({ title, onMenuClick, userEmail }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'
  const initials = getInitials(userEmail)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label={t("topbar.open_menu")}
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title */}
      <h1 className="flex-1 text-sm font-semibold truncate">{title}</h1>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? t("topbar.switch_light") : t("topbar.switch_dark")}
        suppressHydrationWarning
        className="relative"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </Button>

      {/* User avatar */}
      <Avatar size="sm" className="hidden sm:flex">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </header>
  )
}
