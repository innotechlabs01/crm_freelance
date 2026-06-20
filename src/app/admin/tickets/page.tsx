'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle2,
  Timer,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getAdminTickets, updateTicketStatus, type AdminTicket } from '@/app/actions/admin'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Ticket {
  id: string
  user: string
  initials: string
  subject: string
  status: TicketStatus
  priority: string
  created: string
}

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-muted border-t-primary"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}

const statusBadge: Record<string, string> = {
  open: 'bg-red-500/10 text-red-400 border-red-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-muted text-muted-foreground',
}

const statusDot: Record<string, string> = {
  open: 'bg-red-500',
  in_progress: 'bg-amber-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-muted-foreground',
}

const priorityBadge: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-muted text-muted-foreground',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function mapTicket(t: AdminTicket): Ticket {
  return {
    id: t.id,
    user: t.user_name,
    initials: getInitials(t.user_name),
    subject: t.subject,
    status: t.status as TicketStatus,
    priority: t.priority,
    created: t.created_at,
  }
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      const res = await getAdminTickets()
      if (res.success) {
        setTickets((res.data || []).map(mapTicket))
      } else {
        toast.error(res.error || 'Error loading tickets')
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    const res = await updateTicketStatus(id, newStatus)
    if (res.success) {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus as TicketStatus } : t)),
      )
      toast.success('Status updated')
    } else {
      toast.error(res.error || 'Error updating status')
    }
    setUpdatingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={8} />
      </div>
    )
  }

  const openCount = tickets.filter((t) => t.status === 'open').length
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length
  const totalCount = tickets.length

  const kpiCards = [
    { label: 'Open', value: String(openCount), icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'In Progress', value: String(inProgressCount), icon: Timer, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Resolved', value: String(resolvedCount), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total', value: String(totalCount), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Tickets</h1>
        <p className="text-sm text-muted-foreground">Support and issue tracking</p>
      </div>

      {/* KPI Cards */}
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
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{ticket.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {ticket.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{ticket.user}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-foreground">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn('size-1.5 rounded-full', statusDot[ticket.status])} />
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => v && handleStatusChange(ticket.id, v)}
                        disabled={updatingId === ticket.id}
                      >
                        <SelectTrigger size="sm" className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border capitalize', priorityBadge[ticket.priority] || 'bg-muted text-muted-foreground')}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ticket.created}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
