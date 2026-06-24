import { defineConfig, devices } from '@playwright/test'

const PORT = 3001
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: 'test',
      PLAYWRIGHT_TEST: '1',
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_YWJvdmUtYmVhci03NS5jbGVyay5hY2NvdW50cy5kZXYk',
      CLERK_SECRET_KEY: 'sk_test_bH2RO5ZMTaALxsxNA0Mmd5jIv5FoaIbxeMGHnbW9qQ',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
      NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: '/dashboard',
      NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: '/dashboard',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL: '/',
    },
  },
})
