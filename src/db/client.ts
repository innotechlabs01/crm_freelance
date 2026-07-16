import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TURSO_DATABASE_URL is not set. Cannot connect to database in production.')
  }
  console.warn('[db] TURSO_DATABASE_URL not set, using in-memory database')
}

export const db = createClient({
  url: url || 'file::memory:',
  authToken: authToken || '',
})
