import { test, expect } from '@playwright/test'
import { ClientsPage } from '@/e2e/fixtures/pages'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('CRM Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/clientes', TEST_USERS.professionalUser)
  })

  test('debe cargar la pagina de clientes', async ({ page }) => {
    const clientes = new ClientsPage(page)
    await clientes.expectLoaded()
  })

  test('debe mostrar titulo Clientes', async ({ page }) => {
    await expect(page.getByText('Clientes').first()).toBeVisible()
  })

  test('debe mostrar boton para nuevo cliente', async ({ page }) => {
    await expect(page.getByRole('button', { name: /nuevo|agregar|añadir/i })).toBeVisible()
  })

  test('debe abrir dialogo de nuevo cliente', async ({ page }) => {
    const clientes = new ClientsPage(page)
    await clientes.openNewClientDialog()
  })

  test('debe tener campo de busqueda', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i)
    await expect(searchInput).toBeVisible()
  })

  test('debe mostrar tabla de clientes', async ({ page }) => {
    const table = page.locator('table, [role="table"]').first()
    // Table might be empty initially, but should exist
    await expect(table).toBeVisible()
  })

  test('formulario debe tener campos requeridos', async ({ page }) => {
    const clientes = new ClientsPage(page)
    await clientes.openNewClientDialog()

    const form = page.locator('[role="dialog"]').first()
    await expect(form.getByLabel(/nombre/i)).toBeVisible()
    await expect(form.getByLabel(/email|correo/i)).toBeVisible()
  })
})
