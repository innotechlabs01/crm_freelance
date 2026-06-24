import { test, expect } from '@playwright/test'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('Sidebar Navigation', () => {
  test('navegar a cada modulo CRM desde sidebar como Pro', async ({ page }) => {
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

      // Verify URL changed
      const url = page.url()
      expect(url).toContain(p.url)

      // Verify page content loaded
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('sidebar debe ser colapsable', async ({ page }) => {
    await goTo(page, '/dashboard', TEST_USERS.professionalUser)

    const sidebar = page.locator('aside')
    const initialWidth = (await sidebar.boundingBox())?.width ?? 0

    // Find and click collapse toggle
    const collapseBtn = sidebar.locator('button').last()
    await collapseBtn.click()
    await page.waitForTimeout(300)

    const collapsedWidth = (await sidebar.boundingBox())?.width ?? 0
    expect(collapsedWidth).toBeLessThan(initialWidth)
  })
})

test.describe('Theme Toggle', () => {
  test('debe poder cambiar entre dark y light mode', async ({ page }) => {
    await goTo(page, '/dashboard', TEST_USERS.professionalUser)

    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')

    // Find theme toggle button
    const themeToggle = page.locator('[class*="theme"], [aria-label*="theme" i], [aria-label*="tema" i]').first()
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(300)

      const newClass = await html.getAttribute('class')
      expect(newClass).not.toBe(initialClass)
    }
  })
})
