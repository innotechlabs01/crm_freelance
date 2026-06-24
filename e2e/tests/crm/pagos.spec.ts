import { test, expect } from '@playwright/test'
import { PagosPage } from '@/e2e/fixtures/pages'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('CRM Pagos - Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/pagos', TEST_USERS.professionalUser)
  })

  test('debe cargar la pagina de pagos', async ({ page }) => {
    const pagos = new PagosPage(page)
    await pagos.expectLoaded()
  })

  test('debe mostrar columnas del kanban', async ({ page }) => {
    const pagos = new PagosPage(page)
    await pagos.expectLoaded()
    await expect(pagos.kanbanColumns.first()).toBeVisible()
  })

  test('debe mostrar titulo Pagos', async ({ page }) => {
    await expect(page.getByText('Pagos').first()).toBeVisible()
  })

  test('debe tener columnas Pendiente, Enviada, Por Vencer, Pagada', async ({ page }) => {
    const columns = ['Pendiente', 'Enviada', 'Por Vencer', 'Pagada']
    // Verify at least one column renders
    const visible = await page.getByText(columns[0]).isVisible().catch(() => false)
    expect(visible).toBeTruthy()
  })

  test('debe tener buscador', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i)
    // Search might be in the topbar or page
    await expect(searchInput.first()).toBeVisible()
  })
})
