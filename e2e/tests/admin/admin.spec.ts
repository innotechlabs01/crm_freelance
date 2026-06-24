import { test, expect } from '@playwright/test'
import {
  AdminDashboardPage,
  AdminUsuariosPage,
  AdminSuscripcionesPage,
  AdminTicketsPage,
  AdminIncidentesPage,
  AdminSistemaPage,
} from '@/e2e/fixtures/pages'
import { goTo, TEST_USERS } from '@/e2e/fixtures/auth'


test.describe('Admin Panel', () => {
  test.describe('Admin Dashboard', () => {
    test('debe cargar el dashboard de admin', async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.adminUser)
      const admin = new AdminDashboardPage(page)
      await admin.expectLoaded()
    })

    test('debe mostrar metricas', async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.adminUser)
      const admin = new AdminDashboardPage(page)
      await admin.expectLoaded()
      await expect(admin.metrics.first()).toBeVisible()
    })

    test('no-admin no debe acceder', async ({ page }) => {
      await goTo(page, '/admin', TEST_USERS.freeUser)
      // Should redirect or show unauthorized
      const title = await page.title()
      // Non-admin should not see admin content
      expect(title).not.toMatch(/admin/i)
    })
  })

  test.describe('Admin Usuarios', () => {
    test('debe cargar la pagina de usuarios', async ({ page }) => {
      await goTo(page, '/admin/usuarios', TEST_USERS.adminUser)
      const usuarios = new AdminUsuariosPage(page)
      await usuarios.expectLoaded()
    })

    test('debe mostrar tabla de usuarios', async ({ page }) => {
      await goTo(page, '/admin/usuarios', TEST_USERS.adminUser)
      const usuarios = new AdminUsuariosPage(page)
      await expect(usuarios.usersTable).toBeVisible()
    })

    test('debe tener campo de busqueda', async ({ page }) => {
      await goTo(page, '/admin/usuarios', TEST_USERS.adminUser)
      const usuarios = new AdminUsuariosPage(page)
      await expect(usuarios.searchInput).toBeVisible()
    })
  })

  test.describe('Admin Suscripciones', () => {
    test('debe cargar suscripciones', async ({ page }) => {
      await goTo(page, '/admin/suscripciones', TEST_USERS.adminUser)
      const subs = new AdminSuscripcionesPage(page)
      await subs.expectLoaded()
    })
  })

  test.describe('Admin Tickets', () => {
    test('debe cargar tickets', async ({ page }) => {
      await goTo(page, '/admin/tickets', TEST_USERS.adminUser)
      const tickets = new AdminTicketsPage(page)
      await tickets.expectLoaded()
    })
  })

  test.describe('Admin Incidentes', () => {
    test('debe cargar incidentes', async ({ page }) => {
      await goTo(page, '/admin/incidentes', TEST_USERS.adminUser)
      const incidentes = new AdminIncidentesPage(page)
      await incidentes.expectLoaded()
    })
  })

  test.describe('Admin Sistema', () => {
    test('debe cargar sistema', async ({ page }) => {
      await goTo(page, '/admin/sistema', TEST_USERS.adminUser)
      const sistema = new AdminSistemaPage(page)
      await sistema.expectLoaded()
    })
  })
})
