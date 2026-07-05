export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { runMigrations } = await import('@/db/migrate')
      await runMigrations()
      console.log('[instrumentation] Migrations and seed completed')
    } catch (err) {
      console.error('[instrumentation] Migration error:', err)
    }
  }
}
