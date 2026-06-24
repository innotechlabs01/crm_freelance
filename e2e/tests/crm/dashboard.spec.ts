import { test, expect } from '@playwright/test'
import { DashboardPage } from '@/e2e/fixtures/pages'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('CRM Dashboard', () => {
  test.describe('Free User', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.freeUser)
    })

    test('debe cargar el sidebar con navegacion', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      await dashboard.expectLoaded()
      await dashboard.expectSidebarItems([
        'Dashboard', 'Clientes', 'Cuentas de Cobro',
        'Pagos', 'Calendario', 'Configuración',
      ])
    })

    test('free user NO debe ver Reportes en sidebar', async ({ page }) => {
      await expect(page.locator('aside').getByText('Reportes')).not.toBeVisible()
    })

    test('debe mostrar el titulo Dashboard en topbar', async ({ page }) => {
      await expect(page.getByText('Dashboard').first()).toBeVisible()
    })

    test('debe mostrar el badge de plan FREE', async ({ page }) => {
      await expect(page.locator('aside').getByText('FREE')).toBeVisible()
    })

    test('debe mostrar el email del usuario en sidebar', async ({ page }) => {
      await expect(page.locator('aside').getByText('free@test.com')).toBeVisible()
    })

    test('debe cargar KPIs o contenido principal', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      await dashboard.expectLoaded()
    })
  })

  test.describe('Professional User', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)
    })

    test('debe ver Reportes en sidebar', async ({ page }) => {
      await expect(page.locator('aside').getByText('Reportes')).toBeVisible()
    })

    test('debe mostrar badge PRO', async ({ page }) => {
      await expect(page.locator('aside').getByText('PRO')).toBeVisible()
    })
  })

  test.describe('Enterprise User', () => {
    test.beforeEach(async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.enterpriseUser)
    })

    test('debe mostrar badge ENT', async ({ page }) => {
      await expect(page.locator('aside').getByText('ENT')).toBeVisible()
    })
  })
})
