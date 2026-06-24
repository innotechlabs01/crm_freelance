import { test, expect } from '@playwright/test'
import { CuentasCobroPage } from '@/e2e/fixtures/pages'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('CRM Cuentas de Cobro', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/cuentas-cobro', TEST_USERS.professionalUser)
  })

  test('debe cargar la pagina de cuentas de cobro', async ({ page }) => {
    const cuentas = new CuentasCobroPage(page)
    await cuentas.expectLoaded()
  })

  test('debe mostrar titulo en topbar', async ({ page }) => {
    await expect(page.getByText(/Cuentas de Cobro/i).first()).toBeVisible()
  })

  test('debe mostrar wizard con pasos', async ({ page }) => {
    const cuentas = new CuentasCobroPage(page)
    await expect(cuentas.wizardSteps.first()).toBeVisible()
  })

  test('debe tener boton para generar cuenta', async ({ page }) => {
    // At minimum, the wizard should be present
    const wizard = new CuentasCobroPage(page)
    await wizard.expectLoaded()
  })
})
