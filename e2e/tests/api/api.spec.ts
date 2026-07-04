import { test, expect } from '@playwright/test'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'

test.describe('API Routes', () => {
  test.describe('GET /api/auth/me', () => {
    test('debe retornar 200 con datos mock del usuario', async ({ page }) => {
      await goTo(page, '/dashboard', TEST_USERS.professionalUser)

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/auth/me')
        return { status: res.status, data: await res.json() }
      })

      expect(response.status).toBe(200)
      expect(response.data.plan).toBeDefined()
      expect(response.data.permissions).toBeInstanceOf(Array)
    })

    test('debe retornar plan Professional', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/auth/me')
        return res.json()
      })

      expect(response.plan.name).toBe('professional')
      expect(response.permissions).toContain('advanced_reports')
    })
  })

  test.describe('POST /api/paddle/checkout', () => {
    test('debe requerir autenticacion', async ({ request }) => {
      const response = await request.post('/api/paddle/checkout', {
        data: { planName: 'professional' },
      })
      expect(response.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe('POST /api/paddle/webhook', () => {
    test('debe ser publica (sin auth)', async ({ request }) => {
      const response = await request.post('/api/paddle/webhook', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({}),
      })
      expect(response.status()).toBe(400)
    })
  })

  test.describe('GET /api/migrate', () => {
    test('debe ejecutar migraciones', async ({ request }) => {
      const response = await request.get('/api/migrate')
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data.success).toBe(true)
    })
  })
})
