'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Sparkles,
  DollarSign,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getAdminUsers } from '@/app/actions/admin'
import { getAdminSubscriptions } from '@/app/actions/admin'

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-muted border-t-primary"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [kpiCards, setKpiCards] = useState<{
    label: string
    value: string
    change: string
    icon: typeof Users
    color: string
    bgColor: string
  }[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; value: number }[]>([])
  const [funnelSteps, setFunnelSteps] = useState<{ label: string; value: number; pct: number | null; color: string }[]>([])

  useEffect(() => {
    async function fetchData() {
      const [usersRes, subsRes] = await Promise.all([
        getAdminUsers(),
        getAdminSubscriptions(),
      ])

      if (!usersRes.success) {
        toast.error(usersRes.error || 'Error loading users')
      }
      if (!subsRes.success) {
        toast.error(subsRes.error || 'Error loading subscriptions')
      }

      const users = usersRes.data || []
      const subs = subsRes.data || []

      const totalUsers = users.length
      const trialUsers = users.filter((u) => u.plan === 'Trial' || u.status === 'trial').length
      const activeSubs = subs.filter((s) => s.status === 'active').length
      const totalRevenue = subs.reduce((sum, s) => sum + (s.amount || 0), 0)
      const monthlyRevenueAmounts = subs
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0)

      setKpiCards([
        {
          label: 'Active Users',
          value: totalUsers.toLocaleString(),
          change: '',
          icon: Users,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
        },
        {
          label: 'Trial Users',
          value: trialUsers.toLocaleString(),
          change: '',
          icon: Sparkles,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
        },
        {
          label: 'Total Revenue',
          value: `$${Math.round(totalRevenue / 1000).toLocaleString()}k`,
          change: '',
          icon: DollarSign,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
        },
        {
          label: 'Active Subs',
          value: activeSubs.toLocaleString(),
          change: '',
          icon: CreditCard,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
        },
      ])

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const now = new Date()
      const currentMonthIdx = now.getMonth()
      const revenueChart = months.map((m, i) => {
        if (i === currentMonthIdx) return { month: m, value: Math.round(monthlyRevenueAmounts / 1000) }
        return { month: m, value: 0 }
      })
      setMonthlyRevenue(revenueChart)

      const trialCount = subs.filter((s) => s.status === 'trial' || s.plan_name === 'Trial').length
      const paidCount = subs.filter((s) => s.status === 'active' && s.amount > 0).length
      const signups = totalUsers
      const visitorsEstimate = Math.round(signups * 3.5)

      setFunnelSteps([
        { label: 'Visitors', value: visitorsEstimate, pct: null, color: 'bg-blue-500' },
        { label: 'Signups', value: signups, pct: signups > 0 ? Math.round((signups / visitorsEstimate) * 1000) / 10 : null, color: 'bg-purple-500' },
        { label: 'Trials', value: trialCount, pct: signups > 0 ? Math.round((trialCount / signups) * 1000) / 10 : null, color: 'bg-amber-500' },
        { label: 'Paid', value: paidCount, pct: trialCount > 0 ? Math.round((paidCount / trialCount) * 1000) / 10 : null, color: 'bg-emerald-500' },
      ])

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={8} />
      </div>
    )
  }

  const maxRev = monthlyRevenue.reduce((m, r) => Math.max(m, r.value), 10) || 100

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Mission Control
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <div className={cn('flex size-8 items-center justify-center rounded-lg', kpi.bgColor)}>
                  <Icon className={cn('size-4', kpi.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                  {kpi.change && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                      <ArrowUpRight className="size-3" />
                      {kpi.change}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly Revenue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <TrendingUp className="size-4 text-muted-foreground" />
              Monthly Revenue (Current)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {monthlyRevenue.map((item) => (
                <div key={item.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    ${item.value}k
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary/60 hover:bg-primary/80 transition-colors"
                    style={{ height: `${maxRev > 0 ? (item.value / maxRev) * 100 : 0}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ArrowRight className="size-4 text-muted-foreground" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {funnelSteps.map((step, i) => (
                <div key={step.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{step.label}</span>
                    <span className="text-muted-foreground">
                      {step.value.toLocaleString()}
                      {step.pct !== null && (
                        <span className="ml-1 text-emerald-400">{step.pct}%</span>
                      )}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded transition-all', step.color)}
                      style={{
                        width: `${funnelSteps[0].value > 0 ? (step.value / funnelSteps[0].value) * 100 : 0}%`,
                        opacity: 1 - i * 0.15,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
