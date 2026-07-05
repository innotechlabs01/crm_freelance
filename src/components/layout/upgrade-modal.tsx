'use client'

import { useState } from 'react'
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

type UpgradeReason = 'client_limit' | 'invoice_limit' | 'premium_feature'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason: UpgradeReason
  featureName?: string
}

export function UpgradeModal({ open, onClose, reason, featureName }: UpgradeModalProps) {
  const { isFree } = useUser()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = t('upgrade.title')
  const descriptionMap: Record<UpgradeReason, string> = {
    client_limit: t('upgrade.client_limit'),
    invoice_limit: t('upgrade.invoice_limit'),
    premium_feature: t('upgrade.premium_feature', { name: featureName ?? 'Esta funcionalidad' }),
  }
  const description = descriptionMap[reason]

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName: 'professional' }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? t('upgrade.error'))
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error(t('upgrade.no_url'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('upgrade.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              {isFree ? (
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t('upgrade.later')}
          </Button>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('upgrade.now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
