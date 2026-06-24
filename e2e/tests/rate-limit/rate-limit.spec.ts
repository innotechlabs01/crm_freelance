import { test, expect } from '@playwright/test';

test.describe('Rate Limiting & Security', () => {
  test('GET /api/seed should return 403', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/seed');
    expect(response.status()).toBe(403);
  });

  test('GET /api/migrate should return 403', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/migrate');
    expect(response.status()).toBe(403);
  });

  test('POST /api/seed should return 403', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/seed');
    expect(response.status()).toBe(403);
  });
});
