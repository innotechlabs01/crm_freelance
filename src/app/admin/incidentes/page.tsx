'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getAdminIncidents, type AdminIncident } from '@/app/actions/admin'

interface Incident {
  id: string
  service: string
  severity: string
  status: string
  timestamp: string
  error: string
}

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-muted border-t-primary"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
}

const incidentStatusBadge: Record<string, string> = {
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  investigating: 'bg-red-500/10 text-red-400 border-red-500/20',
  monitoring: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const incidentStatusDot: Record<string, string> = {
  resolved: 'bg-emerald-500',
  investigating: 'bg-red-500',
  monitoring: 'bg-amber-500',
}

function mapIncident(inc: AdminIncident): Incident {
  return {
    id: inc.id,
    service: inc.service,
    severity: inc.severity,
    status: inc.status,
    timestamp: inc.detected_at,
    error: inc.title || inc.description,
  }
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIncidents() {
      const res = await getAdminIncidents()
      if (res.success) {
        setIncidents((res.data || []).map(mapIncident))
      } else {
        toast.error(res.error || 'Error loading incidents')
      }
      setLoading(false)
    }
    fetchIncidents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={8} />
      </div>
    )
  }

  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length
  const investigatingCount = incidents.filter((i) => i.status === 'investigating').length
  const monitoringCount = incidents.filter((i) => i.status === 'monitoring').length
  const operationalCount = resolvedCount + incidents.filter((i) => i.status === 'open').length

  const statusGrid = [
    { label: 'Operational', count: operationalCount, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Degraded', count: monitoringCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Investigating', count: investigatingCount, icon: Search, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Resolved', count: resolvedCount, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Incidents</h1>
        <p className="text-sm text-muted-foreground">Service status and incident tracking</p>
      </div>

      {/* Status Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusGrid.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className={cn('border-l-2', item.border)}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <div className={cn('flex size-8 items-center justify-center rounded-lg', item.bg)}>
                  <Icon className={cn('size-4', item.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <span className={cn('text-2xl font-bold', item.color)}>{item.count}</span>
                <span className="ml-1 text-sm text-muted-foreground">incidents</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => (
                <TableRow key={inc.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{inc.id}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{inc.service}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('size-1.5 rounded-full', severityDot[inc.severity] || 'bg-muted-foreground')} />
                      <Badge variant="outline" className={cn('border capitalize', severityBadge[inc.severity] || 'bg-muted text-muted-foreground')}>
                        {inc.severity}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('size-1.5 rounded-full', incidentStatusDot[inc.status] || 'bg-muted-foreground')} />
                      <Badge variant="outline" className={cn('border capitalize', incidentStatusBadge[inc.status] || 'bg-muted text-muted-foreground')}>
                        {inc.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inc.timestamp}</TableCell>
                  <TableCell className="max-w-64 truncate text-xs text-muted-foreground">{inc.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
