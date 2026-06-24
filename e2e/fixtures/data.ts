/**
 * Test data fixtures and factories for all CRM entities.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserFixture {
  id: string
  email: string
  plan: {
    id: number
    name: string
    display_name: string
    max_clients: number | null
    max_invoices_per_month: number | null
    price: number
  }
  subscription: {
    status: string
    renewal_at: string | null
  }
  permissions: string[]
  clientCount: number
  monthlyInvoiceCount: number
}

export interface TestClient {
  id: number
  name: string
  email: string
  phone: string
  document_type: string
  document_number: string
  tax_regime: string
  bank_name: string
  bank_account: string
  status: string
}

export interface TestInvoice {
  id: number
  client_id: number
  client_name: string
  number: string
  amount: number
  tax: number
  total: number
  status: string
  due_date: string
  created_at: string
}

export interface TestKpi {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const FreeUser: UserFixture = {
  id: 'user_free_001',
  email: 'free@test.com',
  plan: {
    id: 1,
    name: 'free',
    display_name: 'Free',
    max_clients: 1,
    max_invoices_per_month: 3,
    price: 0,
  },
  subscription: { status: 'active', renewal_at: null },
  permissions: ['basic_access'],
  clientCount: 1,
  monthlyInvoiceCount: 2,
}

export const ProfessionalUser: UserFixture = {
  id: 'user_pro_001',
  email: 'pro@test.com',
  plan: {
    id: 2,
    name: 'professional',
    display_name: 'Professional',
    max_clients: null,
    max_invoices_per_month: null,
    price: 24.99,
  },
  subscription: { status: 'active', renewal_at: '2026-07-22T00:00:00Z' },
  permissions: [
    'basic_access',
    'ai_assistant',
    'payment_reminders',
    'advanced_reports',
    'pdf_branding',
  ],
  clientCount: 15,
  monthlyInvoiceCount: 8,
}

export const EnterpriseUser: UserFixture = {
  id: 'user_ent_001',
  email: 'enterprise@test.com',
  plan: {
    id: 3,
    name: 'enterprise',
    display_name: 'Enterprise',
    max_clients: null,
    max_invoices_per_month: null,
    price: 79.99,
  },
  subscription: { status: 'active', renewal_at: '2026-07-22T00:00:00Z' },
  permissions: [
    'basic_access',
    'ai_assistant',
    'payment_reminders',
    'advanced_reports',
    'pdf_branding',
    'white_label',
    'api_access',
    'team_management',
    'custom_roles',
  ],
  clientCount: 45,
  monthlyInvoiceCount: 32,
}

export const AdminUser: UserFixture = {
  id: 'user_admin_001',
  email: 'admin@test.com',
  plan: {
    id: 3,
    name: 'enterprise',
    display_name: 'Enterprise',
    max_clients: null,
    max_invoices_per_month: null,
    price: 79.99,
  },
  subscription: { status: 'active', renewal_at: '2026-07-22T00:00:00Z' },
  permissions: [
    'admin_access',
    'manage_users',
    'manage_subscriptions',
    'manage_tickets',
    'manage_incidents',
    'manage_system',
  ],
  clientCount: 0,
  monthlyInvoiceCount: 0,
}

export const TEST_USERS = {
  freeUser: FreeUser,
  professionalUser: ProfessionalUser,
  enterpriseUser: EnterpriseUser,
  adminUser: AdminUser,
} as const

// ─── Clients ─────────────────────────────────────────────────────────────────

export function createTestClient(overrides: Partial<TestClient> = {}): TestClient {
  const id = overrides.id ?? Math.floor(Math.random() * 10000)
  return {
    id,
    name: 'Empresa Test S.A.S',
    email: `cliente${id}@test.com`,
    phone: '3001234567',
    document_type: 'NIT',
    document_number: `900.${String(id).padStart(3, '0')}.${id % 10}`,
    tax_regime: 'Régimen Común',
    bank_name: 'Bancolombia',
    bank_account: `123-${String(id).padStart(6, '0')}`,
    status: 'active',
    ...overrides,
  }
}

export function createTestClients(count: number): TestClient[] {
  return Array.from({ length: count }, (_, i) => createTestClient({ id: i + 1 }))
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export function createTestInvoice(overrides: Partial<TestInvoice> = {}): TestInvoice {
  const id = overrides.id ?? Math.floor(Math.random() * 10000)
  const amount = overrides.amount ?? Math.floor(Math.random() * 5000000) + 500000
  const tax = amount * 0.19
  const base = {
    id,
    client_id: 1,
    client_name: 'Empresa Test S.A.S',
    number: `CC-${String(id).padStart(4, '0')}`,
    amount,
    tax,
    status: 'pendiente' as const,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString().split('T')[0],
  }
  return { ...base, ...overrides, total: (overrides.amount ?? amount) * 1.19 }
}

export function createTestInvoices(count: number): TestInvoice[] {
  return Array.from({ length: count }, (_, i) => createTestInvoice({ id: i + 1 }))
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

export function createTestKpis(): TestKpi[] {
  return [
    { label: 'Ingresos del Mes', value: '$12.450.000', change: '+12.5%', trend: 'up' },
    { label: 'Cuentas por Cobrar', value: '$5.230.000', change: '-3.2%', trend: 'down' },
    { label: 'Clientes Activos', value: '15', change: '+2', trend: 'up' },
    { label: 'Tasa de Cobro', value: '87%', change: '+5%', trend: 'up' },
  ]
}

// ─── Sidebar expectations ────────────────────────────────────────────────────

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'cuentas-cobro', label: 'Cuentas de Cobro' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'calendario', label: 'Calendario' },
  { id: 'configuracion', label: 'Configuración' },
] as const

export const ADMIN_SIDEBAR_ITEMS = [
  'Dashboard',
  'Usuarios',
  'Suscripciones',
  'Tickets',
  'Incidentes',
  'Sistema',
]
