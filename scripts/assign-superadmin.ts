// One-off script to assign SUPERADMIN role to a user by email
// Usage: npx tsx scripts/assign-superadmin.ts <email>

import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/assign-superadmin.ts <email>')
  process.exit(1)
}

async function main() {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const dbToken = process.env.TURSO_AUTH_TOKEN

  if (!dbUrl || !dbToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local')
    process.exit(1)
  }

  const db = createClient({ url: dbUrl, authToken: dbToken })
  const clerkKey = process.env.CLERK_SECRET_KEY
  if (!clerkKey) {
    console.error('Missing CLERK_SECRET_KEY in .env.local')
    process.exit(1)
  }

  console.log(`Searching for user: ${email}...`)

  const clerkRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${clerkKey}` } }
  )
  const clerkUsers = await clerkRes.json()

  const users = Array.isArray(clerkUsers) ? clerkUsers : []
  if (users.length === 0) {
    console.error(`No Clerk user found for email: ${email}`)
    process.exit(1)
  }

  const user = users[0]
  console.log(`Found user: ${user.id}`)

  const roleResult = await db.execute({
    sql: 'SELECT id FROM roles WHERE name = ?',
    args: ['SUPERADMIN'],
  })

  if (roleResult.rows.length === 0) {
    console.error('SUPERADMIN role not found in DB. Run migrations first.')
    process.exit(1)
  }

  const roleId = roleResult.rows[0].id as string

  const existingResult = await db.execute({
    sql: 'SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?',
    args: [user.id, roleId],
  })

  if (existingResult.rows.length > 0) {
    console.log(`User ${email} already has SUPERADMIN role.`)
    return
  }

  await db.execute({
    sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
    args: [user.id, roleId],
  })

  console.log(`SUPERADMIN role assigned to ${email} (${user.id})`)
}

main().catch(console.error)
