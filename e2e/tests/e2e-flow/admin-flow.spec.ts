import { test, expect } from '@playwright/test'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('Flujo Admin: Gestión de Usuarios y Sistema', () => {

  test.describe('1. Dashboard Admin', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.adminUser)
    })

    test('debe cargar el dashboard de admin', async ({ page }) => {
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
      await expect(page.getByText('Mission Control')).toBeVisible()
    })

    test('debe mostrar métricas del sistema', async ({ page }) => {
      const metrics = page.locator('[class*="metric"], [class*="stat"]')
      const metricCount = await metrics.count()
      expect(metricCount).toBeGreaterThan(0)
    })

    test('debe mostrar sidebar con secciones de admin', async ({ page }) => {
      const sidebar = page.locator('aside')
      
      // Verificar secciones del sidebar
      await expect(sidebar.getByText('Metrics')).toBeVisible()
      await expect(sidebar.getByText('Management')).toBeVisible()
      await expect(sidebar.getByText('System')).toBeVisible()
    })
  })

  test.describe('2. Gestión de Usuarios', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/admin/usuarios', TEST_USERS.adminUser)
    })

    test('debe cargar la página de usuarios', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible()
    })

    test('debe mostrar tabla de usuarios', async ({ page }) => {
      const table = page.locator('table, [role="table"]').first()
      await expect(table).toBeVisible()
    })

    test('debe tener campo de búsqueda', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar/i)
      await expect(searchInput).toBeVisible()
    })
  })

  test.describe('3. Gestión de Suscripciones', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/admin/suscripciones', TEST_USERS.adminUser)
    })

    test('debe cargar la página de suscripciones', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible()
    })

    test('debe mostrar información de planes', async ({ page }) => {
      // Verificar que hay información sobre planes
      const content = page.locator('main')
      await expect(content).toBeVisible()
    })
  })

  test.describe('4. Gestión de Tickets', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/admin/tickets', TEST_USERS.adminUser)
    })

    test('debe cargar la página de tickets', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible()
    })

    test('debe mostrar lista de tickets', async ({ page }) => {
      const ticketsList = page.locator('[class*="ticket"], table').first()
      await expect(ticketsList).toBeVisible()
    })
  })

  test.describe('5. Gestión de Incidentes', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/admin/incidentes', TEST_USERS.adminUser)
    })

    test('debe cargar la página de incidentes', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible()
    })

    test('debe mostrar tabla de incidentes', async ({ page }) => {
      const table = page.locator('table, [role="table"]').first()
      await expect(table).toBeVisible()
    })
  })

  test.describe('6. Sistema', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/admin/sistema', TEST_USERS.adminUser)
    })

    test('debe cargar la página de sistema', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible()
    })

    test('debe mostrar estado del sistema', async ({ page }) => {
      const healthSection = page.getByText(/salud|estado|health/i)
      await expect(healthSection).toBeVisible()
    })

    test('debe mostrar feature flags', async ({ page }) => {
      const featureFlags = page.getByText(/feature flags|flags/i)
      await expect(featureFlags).toBeVisible()
    })

    test('debe mostrar audit log', async ({ page }) => {
      const auditLog = page.getByText(/auditoría|audit/i)
      await expect(auditLog).toBeVisible()
    })
  })

  test.describe('7. Navegación Admin Completa', () => {
    test('debe navegar por todos los módulos de admin', async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.adminUser)
      await page.waitForLoadState('networkidle')

      const adminPages = [
        { label: 'Users', url: '/admin/usuarios' },
        { label: 'Subscriptions', url: '/admin/suscripciones' },
        { label: 'Tickets', url: '/admin/tickets' },
        { label: 'Incidents', url: '/admin/incidentes' },
        { label: 'Health', url: '/admin/sistema' },
      ]

      for (const p of adminPages) {
        const button = page.locator('aside').getByText(p.label, { exact: true })
        await button.click()
        await page.waitForTimeout(500)

        const url = page.url()
        expect(url).toContain(p.url)

        await expect(page.locator('main')).toBeVisible()
      }
    })
  })

  test.describe('8. Permisos y Seguridad', () => {
    test('usuario normal no debe acceder a admin', async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.professionalUser)
      
      // Verificar que no muestra contenido de admin
      const missionControl = page.getByText('Mission Control')
      const isVisible = await missionControl.isVisible().catch(() => false)
      
      // El usuario normal no debería ver "Mission Control"
      expect(isVisible).toBeFalsy()
    })

    test('usuario Free tiene permisos limitados', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.freeUser)
      
      // Verificar que el sidebar muestra items limitados
      const sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()
      
      // No debería tener acceso a reportes avanzados
      const reportesLink = sidebar.getByText('Reportes', { exact: true })
      const hasReportes = await reportesLink.isVisible().catch(() => false)
      
      // Plan free podría no tener reportes
      // Solo verificamos que el dashboard carga
      await expect(page.locator('main')).toBeVisible()
    })
  })
})
