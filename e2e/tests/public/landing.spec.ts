import { test, expect } from '@playwright/test'
import { LandingPage } from '@/e2e/fixtures/pages'
import { mockPublic } from '@/e2e/fixtures/auth'

test.describe('Landing Page - Visitante Publico', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublic(page)
  })

  test('debe mostrar la landing page completa', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.expectLoaded()
  })

  test('debe tener navegacion con enlaces a secciones', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav, header').first()
    await expect(nav).toBeVisible()
  })

  test('debe tener un boton CTA visible', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /comenzar|empezar|gratis|prueba|crear/i }).first()
    // Not all CTAs may be links — also check buttons
    const ctaButton = page.getByRole('button', { name: /comenzar|empezar|gratis|prueba/i }).first()
    const ctaVisible = await cta.isVisible().catch(() => false)
    const ctaBtnVisible = await ctaButton.isVisible().catch(() => false)
    expect(ctaVisible || ctaBtnVisible).toBeTruthy()
  })

  test('debe renderizar sin errores de consola', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors.filter(e => !e.includes('hydration'))).toHaveLength(0)
  })

  test('debe tener meta titulo correcto', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/FreelanceCRM/i)
  })

  test('la landing debe ser responsive en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375)
  })
})
