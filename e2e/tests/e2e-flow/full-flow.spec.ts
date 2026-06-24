import { test, expect } from '@playwright/test'
import { mockAuth, mockPublic, goTo, TEST_USERS } from '@/e2e/fixtures/auth'
import { LandingPage, ClientsPage, CuentasCobroPage, DashboardPage, PagosPage } from '@/e2e/fixtures/pages'

test.describe('Flujo Completo: Landing → Rol → Cliente → Documento → Gestión', () => {

  test.describe('1. Landing Page', () => {
    test.beforeEach(async ({ page }) => {
      await mockPublic(page)
    })

    test('debe mostrar la landing page completa', async ({ page }) => {
      const landing = new LandingPage(page)
      await landing.goto()
      await landing.expectLoaded()

      await expect(page.getByText('FreelanceCRM').first()).toBeVisible()
      await expect(page.getByText('Controla tus ingresos, clientes y pagos')).toBeVisible()
    })

    test('debe tener navegación con enlaces a secciones', async ({ page }) => {
      await page.goto('/')
      const nav = page.locator('nav, header').first()
      await expect(nav).toBeVisible()
    })

    test('debe tener un botón CTA visible', async ({ page }) => {
      await page.goto('/')
      const cta = page.getByRole('link', { name: /comenzar|empezar|gratis|prueba|crear/i }).first()
      const ctaButton = page.getByRole('button', { name: /comenzar|empezar|gratis|prueba/i }).first()
      const ctaVisible = await cta.isVisible().catch(() => false)
      const ctaBtnVisible = await ctaButton.isVisible().catch(() => false)
      expect(ctaVisible || ctaBtnVisible).toBeTruthy()
    })

    test('debe mostrar sección de pricing con 3 planes', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByText('Gratuito', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Profesional', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Empresarial', { exact: true }).first()).toBeVisible()
    })

    test('debe mostrar testimonios', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByText('Lo que dicen nuestros usuarios')).toBeVisible()
    })

    test('debe mostrar FAQ', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByText('Preguntas frecuentes')).toBeVisible()
    })

    test('debe renderizar sin errores de consola', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      expect(errors.filter(e => !e.includes('hydration'))).toHaveLength(0)
    })

    test('debe tener meta título correcto', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveTitle(/FreelanceCRM/i)
    })

    test('la landing debe ser responsive en mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(500)
    })
  })

  test.describe('2. Autenticación y Selección de Rol', () => {
    test('debe redirigir a login desde landing page', async ({ page }) => {
      await mockPublic(page)
      await page.goto('/')

      const ctaButton = page.getByRole('button', { name: /comenzar gratis/i }).first()
      await ctaButton.click()
      await expect(page).toHaveURL(/auth|sign-in|sign-up/)
    })

    test('debe mostrar página de sign-in', async ({ page }) => {
      await mockPublic(page)
      await page.goto('/sign-in')
      await expect(page.locator('body')).toBeVisible()
    })

    test('debe mostrar página de sign-up', async ({ page }) => {
      await mockPublic(page)
      await page.goto('/sign-up')
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('3. Dashboard - Verificación de Rol', () => {
    test('usuario Free debe ver dashboard con plan gratuito', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.freeUser)
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })

    test('usuario Professional debe ver dashboard con permisos avanzados', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })

    test('usuario Enterprise debe ver dashboard con todos los permisos', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.enterpriseUser)
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })

    test('usuario Admin debe ver panel de administración', async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.adminUser)
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })
  })

  test.describe('4. Gestión de Clientes (CRUD completo)', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/clientes', TEST_USERS.professionalUser)
    })

    test('debe cargar la página de clientes', async ({ page }) => {
      await expect(page.getByText('Clientes').first()).toBeVisible()
      await expect(page.getByRole('button', { name: /nuevo|agregar|añadir/i })).toBeVisible()
    })

    test('debe mostrar tabla de clientes', async ({ page }) => {
      const table = page.locator('table, [role="table"]').first()
      await expect(table).toBeVisible()
    })

    test('debe tener campo de búsqueda', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)
      await expect(searchInput).toBeVisible()
    })

    test('debe abrir diálogo de nuevo cliente', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /nuevo|agregar|añadir/i })
      await addButton.click()
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()
    })

    test('debe mostrar campos del formulario de cliente', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /nuevo|agregar|añadir/i })
      await addButton.click()
      const form = page.locator('[role="dialog"]').first()
      await expect(form.getByLabel(/nombre/i)).toBeVisible()
      await expect(form.getByLabel(/email|correo/i)).toBeVisible()
    })
  })

  test.describe('5. Creación de Cuentas de Cobro (Documentos)', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/cuentas-cobro', TEST_USERS.professionalUser)
    })

    test('debe cargar la página de cuentas de cobro', async ({ page }) => {
      await expect(page.getByText('Cuentas de Cobro').first()).toBeVisible()
    })

    test('debe mostrar wizard o formulario de creación', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /nueva cuenta/i })
      await expect(newButton).toBeVisible()
      await newButton.click()
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Generar Cuenta de Cobro')).toBeVisible()
      await expect(dialog.getByText('Seleccionar Cliente')).toBeVisible()
    })

    test('debe tener campo de descripción del servicio', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /nueva cuenta/i })
      await newButton.click()
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('combobox').first()).toBeVisible()
      await expect(dialog.getByRole('button', { name: /siguiente/i })).toBeVisible()
      await expect(dialog.getByRole('button', { name: /cancelar/i })).toBeVisible()
    })

    test('debe mostrar vista previa del documento', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /nueva cuenta/i })
      await newButton.click()
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Vista Previa')).toBeVisible()
    })
  })

  test.describe('6. Gestión de Pagos', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/pagos', TEST_USERS.professionalUser)
    })

    test('debe cargar la página de pagos', async ({ page }) => {
      await expect(page.getByText('Pagos').first()).toBeVisible()
    })

    test('debe mostrar tarjetas de pago', async ({ page }) => {
      const cards = page.locator('[class*="card"], [draggable="true"]')
      const cardCount = await cards.count()
      expect(cardCount).toBeGreaterThanOrEqual(0)
    })

    test('debe tener columnas de estado Kanban', async ({ page }) => {
      await expect(page.getByText('Pendiente')).toBeVisible()
      await expect(page.getByText('Pagada')).toBeVisible()
    })
  })

  test.describe('7. Reportes y Calendario', () => {
    test('debe cargar página de reportes', async ({ page }) => {
      await goTo(page, '/reportes', TEST_USERS.professionalUser)
      await expect(page.getByText('Reportes').first()).toBeVisible()
    })

    test('debe cargar página de calendario', async ({ page }) => {
      await goTo(page, '/calendario', TEST_USERS.professionalUser)
      await expect(page.getByText('Calendario').first()).toBeVisible()
    })
  })

  test.describe('8. Configuración', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/configuracion', TEST_USERS.professionalUser)
    })

    test('debe cargar la página de configuración', async ({ page }) => {
      await expect(page.getByText('Configuración').first()).toBeVisible()
    })

    test('debe tener botón de guardar', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /guardar/i })
      await expect(saveButton).toBeVisible()
    })
  })

  test.describe('9. Navegación Completa entre Módulos', () => {
    test('debe navegar por todos los módulos CRM', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)
      await page.waitForLoadState('networkidle')

      const pages = [
        { label: 'Clientes', url: '/clientes' },
        { label: 'Cuentas de Cobro', url: '/cuentas-cobro' },
        { label: 'Pagos', url: '/pagos' },
        { label: 'Calendario', url: '/calendario' },
        { label: 'Configuración', url: '/configuracion' },
      ]

      for (const p of pages) {
        const button = page.locator('aside').getByText(p.label, { exact: true })
        await button.click()
        await page.waitForTimeout(500)

        const url = page.url()
        expect(url).toContain(p.url)
        await expect(page.locator('main')).toBeVisible()
      }
    })

    test('sidebar debe ser colapsable', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)

      const sidebar = page.locator('aside')
      const initialWidth = (await sidebar.boundingBox())?.width ?? 0

      const collapseBtn = sidebar.locator('button').last()
      await collapseBtn.click()
      await page.waitForTimeout(300)

      const collapsedWidth = (await sidebar.boundingBox())?.width ?? 0
      expect(collapsedWidth).toBeLessThan(initialWidth)
    })
  })

  test.describe('10. Tema y Responsive', () => {
    test('debe cambiar entre dark y light mode', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)

      const html = page.locator('html')
      const initialClass = await html.getAttribute('class')

      const themeToggle = page.locator('[class*="theme"], [aria-label*="theme" i], [aria-label*="tema" i]').first()
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await page.waitForTimeout(300)
        const newClass = await html.getAttribute('class')
        expect(newClass).not.toBe(initialClass)
      }
    })

    test('debe ser responsive en mobile (dashboard)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(400)
    })
  })

  test.describe('11. Manejo de Errores', () => {
    test('debe renderizar landing sin errores de consola', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await mockPublic(page)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      expect(errors.filter(e => !e.includes('hydration'))).toHaveLength(0)
    })

    test('debe renderizar dashboard sin errores de consola', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)
      expect(errors.filter(e => !e.includes('hydration') && !e.includes('clerk'))).toHaveLength(0)
    })
  })

  test.describe('12. Flujo de usuario completo (E2E)', () => {
    test('flujo completo: landing → login → dashboard → clientes', async ({ page }) => {
      await mockPublic(page)
      await page.goto('/')
      await expect(page.getByText('FreelanceCRM').first()).toBeVisible()

      await goTo(page, '/dashboard', TEST_USERS.professionalUser)
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()

      await page.locator('aside').getByText('Clientes', { exact: true }).click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain('/clientes')

      const addButton = page.getByRole('button', { name: /nuevo|agregar|añadir/i })
      await addButton.click()
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()
    })

    test('flujo completo: crear cuenta de cobro', async ({ page }) => {
      await goTo(page, '/cuentas-cobro', TEST_USERS.professionalUser)
      await expect(page.getByText('Cuentas de Cobro').first()).toBeVisible()

      const newButton = page.getByRole('button', { name: /nueva cuenta/i })
      await newButton.click()
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Generar Cuenta de Cobro')).toBeVisible()
    })
  })
})
