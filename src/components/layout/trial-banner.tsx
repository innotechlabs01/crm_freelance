'use client'

import { useMemo, useState } from 'react'
import { Clock, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'

interface TrialBannerProps {
  className?: string
}

export function TrialBanner({ className }: TrialBannerProps) {
  const { subscription, isFree } = useUser()
  const [dismissed, setDismissed] = useState(false)

  const daysLeft = useMemo(() => {
    if (subscription?.status === 'trialing' && subscription?.renewal_at) {
      const end = new Date(subscription.renewal_at)
      const now = new Date()
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : 0
    }
    return null
  }, [subscription])

  if (dismissed || isFree || daysLeft === null || daysLeft <= 0) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-200 dark:border-amber-800/50',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'} de tu prueba gratuita
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Actualiza tu plan para mantener todas las funcionalidades
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => window.location.href = '/configuracion'}
        >
          <Sparkles className="mr-1.5 size-3.5" />
          Actualizar Ahora
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="flex size-7 items-center justify-center rounded-md text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
