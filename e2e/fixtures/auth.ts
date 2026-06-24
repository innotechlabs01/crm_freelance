import { Page } from '@playwright/test'
import { TEST_USERS, UserFixture, FreeUser, ProfessionalUser, EnterpriseUser, AdminUser } from './data'

export { TEST_USERS, FreeUser, ProfessionalUser, EnterpriseUser, AdminUser }

/**
 * Mocks Clerk authentication in the browser so pages render as if a user
 * is signed in, without needing a real Clerk backend.
 */
export async function mockAuth(page: Page, user: UserFixture = TEST_USERS.freeUser) {
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: user.plan,
        subscription: user.subscription,
        permissions: user.permissions,
        clientCount: user.clientCount,
        monthlyInvoiceCount: user.monthlyInvoiceCount,
      }),
    })
  })
}

/**
 * Sets up unauthenticated state for public pages.
 */
export async function mockPublic(page: Page) {
  // No-op: public pages work without auth mocks
}

/**
 * Navigate as an authenticated user.
 * Goes to sign-in first, then navigates to the target page.
 * The middleware test mode bypass + mockAuth fixture handle the rest.
 */
export async function goTo(page: Page, path: string, user?: UserFixture) {
  await mockAuth(page, user)
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
}
