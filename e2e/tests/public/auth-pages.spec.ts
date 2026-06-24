import { test, expect } from '@playwright/test'
import { mockPublic } from '@/e2e/fixtures/auth'

test.describe('Auth Pages - Public', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublic(page)
  })

  test('/sign-in debe cargar sin errores', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('/sign-up debe cargar sin errores', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('/sign-in debe tener el componente Clerk', async ({ page }) => {
    await page.goto('/sign-in')
    const clerkComponent = page.locator('.cl-rootBox, .cl-card, [class*="cl-"]')
    await expect(clerkComponent.first()).toBeVisible({ timeout: 10000 })
  })

  test('/sign-up debe tener el componente Clerk', async ({ page }) => {
    await page.goto('/sign-up')
    const clerkComponent = page.locator('.cl-rootBox, .cl-card, [class*="cl-"]')
    await expect(clerkComponent.first()).toBeVisible({ timeout: 10000 })
  })
})
