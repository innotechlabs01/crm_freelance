'use client'

import { useState, useEffect } from 'react'
import {
  Server,
  Database,
  Mail,
  CreditCard,
  Zap,
  AlertTriangle,
  TrendingUp,
  Cpu,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  getFeatureFlags,
  toggleFeatureFlag,
  getAuditLogs,
  type FeatureFlag,
  type AuditLogEntry,
} from '@/app/actions/admin'

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-muted border-t-primary"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}

const healthServices = [
  { name: 'API Gateway', status: 'operational', icon: Server, uptime: '99.99%' },
  { name: 'Database', status: 'operational', icon: Database, uptime: '99.97%' },
  { name: 'Email Service', status: 'operational', icon: Mail, uptime: '99.95%' },
  { name: 'Payment Gateway', status: 'degraded', icon: CreditCard, uptime: '98.20%' },
]

const healthStatus: Record<string, { dot: string; label: string; labelColor: string }> = {
  operational: { dot: 'bg-emerald-500', label: 'Operational', labelColor: 'text-emerald-400' },
  degraded: { dot: 'bg-amber-500', label: 'Degraded', labelColor: 'text-amber-400' },
}

const serviceMetrics = [
  { label: 'API Response', value: '45ms', change: '+3%', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Error Rate', value: '0.12%', change: '-0.05%', icon: AlertTriangle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Uptime', value: '99.97%', change: 'Normal', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'CPU', value: '42%', change: 'Normal', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

function getFlagIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('ai') || lower.includes('auto')) return Zap
  if (lower.includes('message') || lower.includes('whatsapp')) return Mail
  if (lower.includes('pdf') || lower.includes('export')) return FileText
  if (lower.includes('dark') || lower.includes('theme')) return Moon
  return Zap
}

// Inline needed icons
function FileText(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" x2="8" y1="13" y2="13"/>
      <line x1="16" x2="8" y1="17" y2="17"/>
      <line x1="8" x2="8" y1="9" y2="9"/>
    </svg>
  )
}

function Moon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  )
}

export default function AdminSystemPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loadingFlags, setLoadingFlags] = useState(true)
  const [loadingAudit, setLoadingAudit] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFlags() {
      const res = await getFeatureFlags()
      if (res.success) {
        setFlags(res.data || [])
      } else {
        toast.error(res.error || 'Error loading feature flags')
      }
      setLoadingFlags(false)
    }
    async function fetchAudit() {
      const res = await getAuditLogs()
      if (res.success) {
        setAuditLog(res.data || [])
      } else {
        toast.error(res.error || 'Error loading audit logs')
      }
      setLoadingAudit(false)
    }
    fetchFlags()
    fetchAudit()
  }, [])

  const toggleFlag = async (id: string, current: boolean) => {
    setTogglingId(id)
    const res = await toggleFeatureFlag(id, !current)
    if (res.success) {
      setFlags((prev) =>
        prev.map((f) => (f.id === id ? { ...f, enabled: !current } : f)),
      )
      toast.success('Feature flag updated')
    } else {
      toast.error(res.error || 'Error updating feature flag')
    }
    setTogglingId(null)
  }

  if (loadingFlags || loadingAudit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={8} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">System</h1>
        <p className="text-sm text-muted-foreground">Health monitoring, configuration, and audit logs</p>
      </div>

      {/* System Health */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">System Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {healthServices.map((svc) => {
            const Icon = svc.icon
            const st = healthStatus[svc.status]
            return (
              <Card key={svc.name}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('size-1.5 rounded-full', st.dot)} />
                          <span className={cn('text-xs', st.labelColor)}>{st.label}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{svc.uptime}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Service Metrics */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Service Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {serviceMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                  <div className={cn('flex size-8 items-center justify-center rounded-lg', metric.bg)}>
                    <Icon className={cn('size-4', metric.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                    <span className={cn(
                      'text-xs',
                      metric.change.startsWith('+') ? 'text-amber-400' : metric.change.startsWith('-') ? 'text-emerald-400' : 'text-muted-foreground',
                    )}>
                      {metric.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Configuration & Audit */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Feature Flags</CardTitle>
            <CardDescription>Toggle platform features on or off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {flags.map((flag) => {
                const Icon = getFlagIcon(flag.name)
                return (
                  <div
                    key={flag.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{flag.name}</p>
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      </div>
                    </div>
                    <Toggle
                      pressed={flag.enabled}
                      onPressedChange={() => toggleFlag(flag.id, flag.enabled)}
                      variant="outline"
                      size="sm"
                      aria-label={`Toggle ${flag.name}`}
                      disabled={togglingId === flag.id}
                    >
                      {flag.enabled ? 'ON' : 'OFF'}
                    </Toggle>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Audit Log</CardTitle>
            <CardDescription>Recent administrative actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs font-medium text-foreground">{entry.user_id || 'System'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.target}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {entry.created_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
