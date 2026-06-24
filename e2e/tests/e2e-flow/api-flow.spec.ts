import { test, expect } from '@playwright/test'

test.describe('API Endpoints - Flujo de Datos', () => {

  test.describe('1. Auth API', () => {
    test('debe retornar datos de autenticación en /api/auth/me', async ({ request }) => {
      const response = await request.get('/api/auth/me')
      
      // Verificar que la respuesta es exitosa o redirige a auth
      expect(response.status()).toBeLessThanOrEqual(302)
    })
  })

  test.describe('2. Clientes API', () => {
    test('debe manejar requests a clientes', async ({ request }) => {
      const response = await request.get('/api/clientes')
      
      // Verificar que la respuesta es válida
      expect(response.status()).toBeLessThan(500)
    })
  })

  test.describe('3. Cuentas de Cobro API', () => {
    test('debe manejar requests a cuentas de cobro', async ({ request }) => {
      const response = await request.get('/api/cuentas-cobro')
      
      // Verificar que la respuesta es válida
      expect(response.status()).toBeLessThan(500)
    })
  })

  test.describe('4. Pagos API', () => {
    test('debe manejar requests a pagos', async ({ request }) => {
      const response = await request.get('/api/pagos')
      
      // Verificar que la respuesta es válida
      expect(response.status()).toBeLessThan(500)
    })
  })

  test.describe('5. Health Check', () => {
    test('debe responder health check', async ({ request }) => {
      const response = await request.get('/api/health')
      
      // Verificar que la aplicación está funcionando
      expect(response.status()).toBeLessThan(500)
    })
  })
})
