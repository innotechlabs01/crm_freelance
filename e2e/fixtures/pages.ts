/**
 * Page Object Models for all CRM and Admin modules.
 * Each class encapsulates selectors and common actions for a page.
 */
import { Page, Locator, expect } from '@playwright/test'

// ─── Base Page ───────────────────────────────────────────────────────────────

export class BaseCRMPage {
  readonly sidebar: Locator
  readonly sidebarNav: Locator
  readonly topbar: Locator
  readonly pageTitle: Locator
  readonly mainContent: Locator
  readonly userAvatar: Locator
  readonly themeToggle: Locator

  constructor(readonly page: Page) {
    this.sidebar = page.locator('aside')
    this.sidebarNav = page.locator('aside nav')
    this.topbar = page.locator('header, [class*="topbar"]').first()
    this.pageTitle = this.topbar
    this.mainContent = page.locator('main')
    this.userAvatar = page.locator('aside [class*="avatar"]').first()
    this.themeToggle = page.locator('[class*="theme"]').first()
  }

  async expectLoaded() {
    await expect(this.sidebar).toBeVisible()
    await expect(this.mainContent).toBeVisible()
  }

  async expectSidebarItems(labels: string[]) {
    for (const label of labels) {
      await expect(this.sidebarNav.getByText(label, { exact: true })).toBeVisible()
    }
  }

  async expectTitle(title: string) {
    await expect(this.pageTitle ?? this.topbar).toContainText(title)
  }

  async navigateViaSidebar(id: string) {
    await this.sidebarNav.getByRole('button', { name: new RegExp(id, 'i') }).click()
    await this.page.waitForLoadState('networkidle')
  }
}

// ─── Landing Page ────────────────────────────────────────────────────────────

export class LandingPage {
  readonly hero: Locator
  readonly ctaButton: Locator
  readonly pricingSection: Locator
  readonly testimonialSection: Locator
  readonly faqSection: Locator
  readonly navbar: Locator

  constructor(readonly page: Page) {
    this.navbar = page.locator('nav, header').first()
    this.hero = page.locator('section').first()
    this.ctaButton = page.getByRole('link', { name: /comenzar|empezar|gratis|prueba/i }).first()
    this.pricingSection = page.getByText(/plan|precio/i).locator('..')
    this.faqSection = page.getByText(/preguntas|faq/i).locator('..')
    this.testimonialSection = page.getByText(/testimonio|cliente/i).locator('..')
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.navbar).toBeVisible()
    await expect(this.hero).toBeVisible()
  }
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export class DashboardPage extends BaseCRMPage {
  readonly kpiCards: Locator
  readonly cashflowChart: Locator
  readonly topClientsTable: Locator
  readonly upcomingInvoices: Locator
  readonly invoiceDistribution: Locator

  constructor(page: Page) {
    super(page)
    this.kpiCards = page.locator('[class*="kpi"], [class*="card"]').filter({
      has: page.locator('[class*="text-2xl"], [class*="text-3xl"]'),
    })
    this.cashflowChart = page.locator('.recharts-wrapper').first()
    this.topClientsTable = page.getByText(/top clientes|mejores clientes/i).locator('..')
    this.upcomingInvoices = page.getByText(/próximas|proximas|por vencer/i).locator('..')
    this.invoiceDistribution = page.locator('.recharts-pie').first()
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.kpiCards.first()).toBeVisible()
  }
}

// ─── Clients Page ────────────────────────────────────────────────────────────

export class ClientsPage extends BaseCRMPage {
  readonly searchInput: Locator
  readonly addButton: Locator
  readonly clientsTable: Locator
  readonly clientDialog: Locator
  readonly clientForm: Locator

  constructor(page: Page) {
    super(page)
    this.searchInput = page.getByPlaceholder(/buscar/i)
    this.addButton = page.getByRole('button', { name: /nuevo|agregar|añadir/i })
    this.clientsTable = page.locator('table, [role="table"]').first()
    this.clientDialog = page.locator('[role="dialog"]').first()
    this.clientForm = page.locator('[role="dialog"] form').first()
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.addButton).toBeVisible()
  }

  async searchClient(name: string) {
    await this.searchInput.fill(name)
    await this.page.keyboard.press('Enter')
    await this.page.waitForTimeout(500)
  }

  async openNewClientDialog() {
    await this.addButton.click()
    await expect(this.clientDialog).toBeVisible()
  }

  async fillClientForm(data: {
    name: string
    email: string
    phone: string
    documentNumber: string
  }) {
    const form = this.clientForm
    await form.getByLabel(/nombre/i).fill(data.name)
    await form.getByLabel(/email|correo/i).fill(data.email)
    await form.getByLabel(/teléfono|telefono/i).fill(data.phone)
    await form.getByLabel(/nit|documento/i).fill(data.documentNumber)
  }

  async saveClient() {
    await this.clientForm.getByRole('button', { name: /guardar|crear/i }).click()
    await expect(this.clientDialog).not.toBeVisible()
  }
}

// ─── Cuentas de Cobro Page ───────────────────────────────────────────────────

export class CuentasCobroPage extends BaseCRMPage {
  readonly wizardSteps: Locator
  readonly stepContent: Locator
  readonly nextButton: Locator
  readonly prevButton: Locator
  readonly generateButton: Locator
  readonly aiAssistantButton: Locator
  readonly invoicePreview: Locator

  constructor(page: Page) {
    super(page)
    this.wizardSteps = page.locator('[class*="step"]')
    this.stepContent = page.locator('[class*="wizard"]').first()
    this.nextButton = page.getByRole('button', { name: /siguiente|continuar/i })
    this.prevButton = page.getByRole('button', { name: /anterior|atrás/i })
    this.generateButton = page.getByRole('button', { name: /generar|crear cuenta/i })
    this.aiAssistantButton = page.getByRole('button', { name: /ia|asistente/i })
    this.invoicePreview = page.locator('[class*="preview"]').first()
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.wizardSteps.first()).toBeVisible()
  }

  async goToNextStep() {
    await this.nextButton.click()
    await this.page.waitForTimeout(300)
  }

  async goToPrevStep() {
    await this.prevButton.click()
    await this.page.waitForTimeout(300)
  }
}

// ─── Pagos Page ──────────────────────────────────────────────────────────────

export class PagosPage extends BaseCRMPage {
  readonly kanbanColumns: Locator
  readonly paymentCards: Locator
  readonly searchInput: Locator
  readonly filterButtons: Locator

  constructor(page: Page) {
    super(page)
    this.kanbanColumns = page.locator('[class*="column"], [class*="kanban"]')
    this.paymentCards = page.locator('[class*="card"], [draggable="true"]')
    this.searchInput = page.getByPlaceholder(/buscar/i)
    this.filterButtons = page.locator('[class*="filter"], [class*="tabs"] button')
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.kanbanColumns.first()).toBeVisible()
  }

  async expectColumns(labels: string[]) {
    for (const label of labels) {
      await expect(this.mainContent.getByText(label, { exact: true })).toBeVisible()
    }
  }

  async dragCardToColumn(cardText: string, columnLabel: string) {
    const card = this.paymentCards.filter({ hasText: cardText }).first()
    const column = this.kanbanColumns.filter({ hasText: columnLabel }).first()
    await card.dragTo(column)
    await this.page.waitForTimeout(300)
  }
}

// ─── Reportes Page ───────────────────────────────────────────────────────────

export class ReportesPage extends BaseCRMPage {
  readonly incomeByMonth: Locator
  readonly incomeByClient: Locator
  readonly pendingVsCollected: Locator
  readonly exportButton: Locator

  constructor(page: Page) {
    super(page)
    this.incomeByMonth = page.locator('.recharts-wrapper').first()
    this.incomeByClient = page.locator('.recharts-wrapper').nth(1)
    this.pendingVsCollected = page.locator('.recharts-wrapper').nth(2)
    this.exportButton = page.getByRole('button', { name: /exportar|descargar/i })
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.incomeByMonth).toBeVisible()
  }
}

// ─── Calendario Page ─────────────────────────────────────────────────────────

export class CalendarioPage extends BaseCRMPage {
  readonly monthHeader: Locator
  readonly prevMonthButton: Locator
  readonly nextMonthButton: Locator
  readonly calendarGrid: Locator
  readonly invoiceMarkers: Locator

  constructor(page: Page) {
    super(page)
    this.monthHeader = page.locator('[class*="month"], h2').first()
    this.prevMonthButton = page.getByRole('button', { name: /anterior|←|<|prev/i }).first()
    this.nextMonthButton = page.getByRole('button', { name: /siguiente|→|>|next/i }).first()
    this.calendarGrid = page.locator('[class*="grid"], [class*="calendar"]').first()
    this.invoiceMarkers = page.locator('[class*="badge"], [class*="indicator"], [class*="dot"]')
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.calendarGrid).toBeVisible()
  }
}

// ─── Configuracion Page ──────────────────────────────────────────────────────

export class ConfiguracionPage extends BaseCRMPage {
  readonly profileSection: Locator
  readonly notificationSection: Locator
  readonly planSection: Locator
  readonly saveButton: Locator
  readonly upgradeButton: Locator

  constructor(page: Page) {
    super(page)
    this.profileSection = page.getByText(/perfil/i).first()
    this.notificationSection = page.getByText(/notificaciones/i).first()
    this.planSection = page.getByText(/plan/i).first()
    this.saveButton = page.getByRole('button', { name: /guardar/i })
    this.upgradeButton = page.getByRole('button', { name: /mejorar|upgrade/i })
  }

  async expectLoaded() {
    await super.expectLoaded()
    await expect(this.profileSection).toBeVisible()
  }
}

// ─── Admin Pages ─────────────────────────────────────────────────────────────

export class AdminDashboardPage extends BaseCRMPage {
  readonly metrics: Locator

  constructor(page: Page) {
    super(page)
    this.metrics = page.locator('[class*="metric"], [class*="stat"]')
  }

  async expectLoaded() {
    await expect(this.mainContent).toBeVisible()
    await expect(this.metrics.first()).toBeVisible()
  }
}

export class AdminUsuariosPage extends BaseCRMPage {
  readonly searchInput: Locator
  readonly usersTable: Locator

  constructor(page: Page) {
    super(page)
    this.searchInput = page.getByPlaceholder(/buscar/i)
    this.usersTable = page.locator('table, [role="table"]').first()
  }

  async expectLoaded() {
    await expect(this.mainContent).toBeVisible()
    await expect(this.usersTable).toBeVisible()
  }
}

export class AdminSuscripcionesPage extends BaseCRMPage {
  readonly subscriptionsTable: Locator

  constructor(page: Page) {
    super(page)
    this.subscriptionsTable = page.locator('table, [role="table"]').first()
  }

  async expectLoaded() {
    await expect(this.mainContent).toBeVisible()
  }
}

export class AdminTicketsPage extends BaseCRMPage {
  readonly ticketsList: Locator

  constructor(page: Page) {
    super(page)
    this.ticketsList = page.locator('[class*="ticket"], table').first()
  }

  async expectLoaded() {
    await expect(this.mainContent).toBeVisible()
  }
}

export class AdminIncidentesPage extends BaseCRMPage {
  readonly incidentsTable: Locator

  constructor(page: Page) {
    super(page)
    this.incidentsTable = page.locator('table, [role="table"]').first()
  }

  async expectLoaded() {
    await expect(this.mainContent).toBeVisible()
  }
}

export class AdminSistemaPage extends BaseCRMPage {
  readonly healthSection: Locator
  readonly featureFlagsSection: Locator
  readonly auditLogSection: Locator

  constructor(page: Page) {
    super(page)
    this.healthSection = page.getByText(/salud|estado|health/i)
    this.featureFlagsSection = page.getByText(/feature flags|flags/i)
    this.auditLogSection = page.getByText(/auditoría|audit/i)
  }

  async expectLoaded() {
    await expect(this.mainContent).toBeVisible()
  }
}
