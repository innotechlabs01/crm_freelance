'use client'

import { useState } from 'react'
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'

type UpgradeReason = 'client_limit' | 'invoice_limit' | 'premium_feature'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason: UpgradeReason
  featureName?: string
}

const messages: Record<UpgradeReason, (featureName?: string) => { title: string; description: string }> = {
  client_limit: () => ({
    title: 'Actualiza tu Plan',
    description:
      'Has alcanzado el límite de tu Plan Gratuito (1 cliente). Actualiza a Profesional para crear clientes ilimitados.',
  }),
  invoice_limit: () => ({
    title: 'Actualiza tu Plan',
    description:
      'Has alcanzado tu límite mensual de 3 cuentas de cobro. Actualiza para continuar.',
  }),
  premium_feature: (featureName?: string) => ({
    title: 'Actualiza tu Plan',
    description: `'${featureName ?? 'Esta funcionalidad'}' requiere un plan Profesional.`,
  }),
}

export function UpgradeModal({ open, onClose, reason, featureName }: UpgradeModalProps) {
  const { isFree } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { title, description } = messages[reason](featureName)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Error al crear la sesión de pago')
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No se recibió la URL de pago')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la sesión de pago')
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
            Ahora no
          </Button>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Actualizar Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
