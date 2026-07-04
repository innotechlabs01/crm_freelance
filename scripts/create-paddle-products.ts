// Script to create Paddle products & prices in Sandbox
// Usage: npx tsx scripts/create-paddle-products.ts

import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const apiKey = process.env.PADDLE_SANDBOX_API_KEY
if (!apiKey) {
  console.error('PADDLE_SANDBOX_API_KEY not found in .env.local')
  process.exit(1)
}

const paddle = new Paddle(apiKey, { environment: Environment.sandbox })

async function main() {
  console.log('Connecting to Paddle Sandbox...')

  // 1. Create Professional product
  console.log('\n--- Creating Professional product ---')
  const proProduct = await paddle.products.create({
    name: 'Professional',
    taxCategory: 'saas',
    description: 'Plan Profesional - Clientes ilimitados, facturas ilimitadas, IA, reportes avanzados',
  })
  console.log(`Product ID: ${proProduct.id}`)

  // Create Professional price ($24.99/month)
  const proPrice = await paddle.prices.create({
    description: 'Professional Monthly',
    productId: proProduct.id,
    unitPrice: { amount: '2499', currencyCode: 'USD' },
    billingCycle: { interval: 'month', frequency: 1 },
    taxMode: 'account_setting',
  })
  console.log(`Price ID:  ${proPrice.id}`)

  // 2. Create Enterprise product
  console.log('\n--- Creating Enterprise product ---')
  const entProduct = await paddle.products.create({
    name: 'Enterprise',
    taxCategory: 'saas',
    description: 'Plan Empresarial - Todo Professional + white label, API access, gestion de equipo',
  })
  console.log(`Product ID: ${entProduct.id}`)

  // Create Enterprise price ($79.99/month)
  const entPrice = await paddle.prices.create({
    description: 'Enterprise Monthly',
    productId: entProduct.id,
    unitPrice: { amount: '7999', currencyCode: 'USD' },
    billingCycle: { interval: 'month', frequency: 1 },
    taxMode: 'account_setting',
  })
  console.log(`Price ID:  ${entPrice.id}`)

  // 3. Update .env.local
  const envPath = resolve(process.cwd(), '.env.local')
  let envContent = readFileSync(envPath, 'utf-8')

  envContent = envContent
    .replace(/PADDLE_PRO_PRICE_ID=.*/, `PADDLE_PRO_PRICE_ID=${proPrice.id}`)
    .replace(/PADDLE_PRO_PRODUCT_ID=.*/, `PADDLE_PRO_PRODUCT_ID=${proProduct.id}`)
    .replace(/PADDLE_ENTERPRISE_PRICE_ID=.*/, `PADDLE_ENTERPRISE_PRICE_ID=${entPrice.id}`)
    .replace(/PADDLE_ENTERPRISE_PRODUCT_ID=.*/, `PADDLE_ENTERPRISE_PRODUCT_ID=${entProduct.id}`)

  writeFileSync(envPath, envContent)
  console.log('\n.env.local updated with product & price IDs!')
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
