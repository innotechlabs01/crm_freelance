'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Download,
  Plus,
  Eye,
  Mail,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getAdminUsers, type AdminUser } from '@/app/actions/admin'

type Plan = 'Free' | 'Trial' | 'Professional' | 'Enterprise'
type UserStatus = 'Active' | 'Trial' | 'Canceled' | 'Suspended'

interface User {
  id: string
  name: string
  email: string
  plan: Plan
  status: UserStatus
  registered: string
  initials: string
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

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  Active: 'bg-emerald-500',
  trial: 'bg-purple-500',
  Trial: 'bg-purple-500',
  canceled: 'bg-muted-foreground',
  Canceled: 'bg-muted-foreground',
  suspended: 'bg-red-500',
  Suspended: 'bg-red-500',
}

const statusLabel: Record<string, string> = {
  active: 'Active',
  Active: 'Active',
  trial: 'Trial',
  Trial: 'Trial',
  canceled: 'Canceled',
  Canceled: 'Canceled',
  suspended: 'Suspended',
  Suspended: 'Suspended',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function normalizeStatus(status: string): UserStatus {
  const s = status.toLowerCase()
  if (s === 'active') return 'Active'
  if (s === 'trial') return 'Trial'
  if (s === 'canceled' || s === 'cancelled') return 'Canceled'
  if (s === 'suspended') return 'Suspended'
  return 'Active'
}

function normalizePlan(plan: string): Plan {
  const p = plan.toLowerCase()
  if (p === 'free') return 'Free'
  if (p === 'trial') return 'Trial'
  if (p === 'professional' || p === 'pro') return 'Professional'
  if (p === 'enterprise') return 'Enterprise'
  return 'Free'
}

function mapUser(u: AdminUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    plan: normalizePlan(u.plan),
    status: normalizeStatus(u.status),
    registered: u.created_at || '',
    initials: getInitials(u.name),
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      const res = await getAdminUsers()
      if (res.success) {
        setUsers((res.data || []).map(mapUser))
      } else {
        toast.error(res.error || 'Error loading users')
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (planFilter !== 'all' && u.plan.toLowerCase() !== planFilter) return false
    if (statusFilter !== 'all' && u.status.toLowerCase() !== statusFilter) return false
    return true
  })

  const activeCount = users.filter((u) => u.status === 'Active').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={8} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length.toLocaleString()} registered · {activeCount.toLocaleString()} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="size-3.5" />
            New User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border', planBadge[user.plan] || 'bg-muted text-muted-foreground')}>
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('size-1.5 rounded-full', statusDot[user.status])} />
                      <span className="text-xs text-muted-foreground">{statusLabel[user.status]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.registered}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => setSelectedUser(user)}>
                        <Eye className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col gap-4">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {selectedUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className={cn('border text-xs', planBadge[selectedUser.plan] || 'bg-muted text-muted-foreground')}>
                      {selectedUser.plan}
                    </Badge>
                    <span className={cn('size-1.5 rounded-full', statusDot[selectedUser.status])} />
                    <span className="text-xs text-muted-foreground">{statusLabel[selectedUser.status]}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Registered {selectedUser.registered}</span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-foreground">Subscription</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedUser.plan} plan · Since {selectedUser.registered}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="tickets" className="pt-4">
                  <p className="text-sm text-muted-foreground">No tickets for this user.</p>
                </TabsContent>
                <TabsContent value="audit" className="pt-4">
                  <p className="text-sm text-muted-foreground">Audit log entries will appear here.</p>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
