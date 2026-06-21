'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Calendar,
  Users,
  TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getAdminSubscriptions, type AdminSubscription } from '@/app/actions/admin'

interface Subscription {
  id: string
  user: string
  initials: string
  plan: string
  amount: number
  status: string
  renewal: string
}

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-muted border-t-primary"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}

const planBadge: Record<string, string> = {
  Free: 'bg-muted text-muted-foreground',
  Trial: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Professional: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  canceled: 'bg-muted text-muted-foreground',
  past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function planBadgeColor(plan: string): string {
  const p = plan.toLowerCase()
  if (p === 'free') return 'bg-muted text-muted-foreground'
  if (p === 'trial') return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  if (p === 'professional' || p === 'pro') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (p === 'enterprise') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-muted text-muted-foreground'
}

function statusBadgeColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (s === 'canceled' || s === 'cancelled') return 'bg-muted text-muted-foreground'
  if (s === 'past_due') return 'bg-red-500/10 text-red-400 border-red-500/20'
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

function fmtExact(n: number): string {
  if (n === 0) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100)
}

function mapSub(s: AdminSubscription): Subscription {
  return {
    id: s.id,
    user: s.user_name,
    initials: getInitials(s.user_name),
    plan: s.plan_name,
    amount: s.amount || 0,
    status: s.status,
    renewal: s.renewal_at || '',
  }
}

export default function AdminSubsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubs() {
      const res = await getAdminSubscriptions()
      if (res.success) {
        setSubs((res.data || []).map(mapSub))
      } else {
        toast.error(res.error || 'Error loading subscriptions')
      }
      setLoading(false)
    }
    fetchSubs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={8} />
      </div>
    )
  }

  const activeSubs = subs.filter((s) => s.status === 'active').length
  const trialSubs = subs.filter((s) => s.plan?.toLowerCase() === 'trial').length
  const mrr = subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount || 0), 0)
  const totalRevenue = subs.reduce((sum, s) => sum + (s.amount || 0), 0)

  const kpiCards = [
    { label: 'Active Subs', value: activeSubs.toLocaleString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Trial Users', value: trialSubs.toLocaleString(), icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total MRR', value: fmtExact(mrr), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Revenue', value: fmtExact(totalRevenue), icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Manage active plans and billing cycles</p>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <div className={cn('flex size-8 items-center justify-center rounded-lg', kpi.bg)}>
                  <Icon className={cn('size-4', kpi.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{sub.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {sub.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{sub.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border', planBadgeColor(sub.plan))}>
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium text-foreground">
                    {fmtExact(sub.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border capitalize', statusBadgeColor(sub.status))}>
                      {sub.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{sub.renewal || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
