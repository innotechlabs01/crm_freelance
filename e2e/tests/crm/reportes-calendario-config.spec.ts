import { test, expect } from '@playwright/test'
import { ReportesPage, CalendarioPage, ConfiguracionPage } from '@/e2e/fixtures/pages'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('CRM Reportes', () => {
  test('Professional user debe poder acceder a reportes', async ({ page }) => {
    await goTo(page, '/reportes', TEST_USERS.professionalUser)
    const reportes = new ReportesPage(page)
    await reportes.expectLoaded()
  })

  test('Free user NO debe poder acceder a reportes', async ({ page }) => {
    await goTo(page, '/reportes', TEST_USERS.freeUser)
    // Should redirect or show error since free users lack advanced_reports
    const reportsVisible = await page.locator('.recharts-wrapper').first().isVisible()
      .catch(() => false)
    // Free user should not see reports
    expect(reportsVisible).toBeFalsy()
  })

  test('debe mostrar graficos de reportes para pro user', async ({ page }) => {
    await goTo(page, '/reportes', TEST_USERS.professionalUser)
    const reportes = new ReportesPage(page)
    await reportes.expectLoaded()
    await expect(reportes.incomeByMonth).toBeVisible()
  })
})

test.describe('CRM Calendario', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/calendario', TEST_USERS.professionalUser)
  })

  test('debe cargar el calendario', async ({ page }) => {
    const calendario = new CalendarioPage(page)
    await calendario.expectLoaded()
  })

  test('debe mostrar grid del mes', async ({ page }) => {
    const calendario = new CalendarioPage(page)
    await expect(calendario.calendarGrid).toBeVisible()
  })

  test('debe tener navegacion entre meses', async ({ page }) => {
    const calendario = new CalendarioPage(page)
    await expect(calendario.prevMonthButton).toBeVisible()
    await expect(calendario.nextMonthButton).toBeVisible()
  })
})

test.describe('CRM Configuracion', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/configuracion', TEST_USERS.professionalUser)
  })

  test('debe cargar la pagina de configuracion', async ({ page }) => {
    const config = new ConfiguracionPage(page)
    await config.expectLoaded()
  })

  test('debe mostrar seccion de perfil', async ({ page }) => {
    const config = new ConfiguracionPage(page)
    await expect(config.profileSection).toBeVisible()
  })

  test('debe mostrar informacion del plan actual', async ({ page }) => {
    const planText = page.getByText(/Professional|Plan actual/i).first()
    await expect(planText).toBeVisible()
  })
})
