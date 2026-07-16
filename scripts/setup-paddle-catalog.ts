import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const apiKey = process.env.PADDLE_SANDBOX_API_KEY
if (!apiKey) {
  console.error('PADDLE_SANDBOX_API_KEY not found in .env.local')
  process.exit(1)
}

const paddle = new Paddle(apiKey, { environment: Environment.sandbox })

// Existing product IDs from your Paddle sandbox
const products = {
  starter: { id: 'pro_01kwqdpxj8106xt9se484p6bvz', name: 'Starter' },
  pro: { id: 'pro_01kwqdpy5f0pshkb0x67sgk75z', name: 'Pro' },
  elite: { id: 'pro_01kwqdpxvs4v7q79zppkk20br0', name: 'Elite' },
}

// Price configuration (in cents, as strings per Paddle docs)
const prices = {
  starter: {
    monthly: { amount: '9900', label: '$99/month' },
    annual: { amount: '99000', label: '$990/year' },
    gbp: { monthly: '7899', annual: '78999', label: '£78.99/£789.99' },
    eur: { monthly: '9199', annual: '91999', label: '€91.99/€919.99' },
    aud: { monthly: '15199', annual: '151999', label: 'A$151.99/A$1,519.99' },
  },
  pro: {
    monthly: { amount: '34900', label: '$349/month' },
    annual: { amount: '349000', label: '$3,490/year' },
    gbp: { monthly: '27599', annual: '275999', label: '£275.99/£2,759.99' },
    eur: { monthly: '32199', annual: '321999', label: '€321.99/€3,219.99' },
    aud: { monthly: '53499', annual: '534999', label: 'A$534.99/A$5,349.99' },
  },
  elite: {
    monthly: { amount: '19900', label: '$199/month' },
    annual: { amount: '199000', label: '$1,990/year' },
    gbp: { monthly: '15799', annual: '157999', label: '£157.99/£1,579.99' },
    eur: { monthly: '18399', annual: '183999', label: '€183.99/€1,839.99' },
    aud: { monthly: '30499', annual: '304999', label: 'A$304.99/A$3,049.99' },
  },
}

async function main() {
  console.log('=== Paddle Catalog Setup ===\n')
  console.log('Adding annual pricing, 7-day trials, and country overrides...\n')

  const results: Record<string, any> = {}

  for (const [planKey, product] of Object.entries(products)) {
    console.log(`\n--- ${product.name} (${product.id}) ---`)
    const planPrices = prices[planKey as keyof typeof prices]

    // 1. Create Monthly price with trial + country overrides
    console.log(`Creating monthly price with 7-day trial...`)
    const monthlyPrice = await paddle.prices.create({
      productId: product.id,
      description: `${product.name} Monthly`,
      unitPrice: { amount: planPrices.monthly.amount, currencyCode: 'USD' },
      billingCycle: { interval: 'month', frequency: 1 },
      trialPeriod: { interval: 'day', frequency: 7 },
      taxMode: 'account_setting',
      unitPriceOverrides: [
        { countryCodes: ['GB'], unitPrice: { amount: planPrices.gbp.monthly, currencyCode: 'GBP' } },
        { countryCodes: ['IE'], unitPrice: { amount: planPrices.eur.monthly, currencyCode: 'EUR' } },
        { countryCodes: ['AU'], unitPrice: { amount: planPrices.aud.monthly, currencyCode: 'AUD' } },
      ],
    })
    console.log(`  ✓ Monthly: ${monthlyPrice.id} — ${planPrices.monthly.label}`)
    console.log(`    Trial: 7 days | Overrides: GB, IE, AU`)

    // 2. Create Annual price with trial + country overrides
    console.log(`Creating annual price with 7-day trial...`)
    const annualPrice = await paddle.prices.create({
      productId: product.id,
      description: `${product.name} Annual`,
      unitPrice: { amount: planPrices.annual.amount, currencyCode: 'USD' },
      billingCycle: { interval: 'year', frequency: 1 },
      trialPeriod: { interval: 'day', frequency: 7 },
      taxMode: 'account_setting',
      unitPriceOverrides: [
        { countryCodes: ['GB'], unitPrice: { amount: planPrices.gbp.annual, currencyCode: 'GBP' } },
        { countryCodes: ['IE'], unitPrice: { amount: planPrices.eur.annual, currencyCode: 'EUR' } },
        { countryCodes: ['AU'], unitPrice: { amount: planPrices.aud.annual, currencyCode: 'AUD' } },
      ],
    })
    console.log(`  ✓ Annual: ${annualPrice.id} — ${planPrices.annual.label}`)
    console.log(`    Trial: 7 days | Overrides: GB, IE, AU`)

    results[planKey] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    }
  }

  // 3. Archive old monthly prices (no trial, no overrides)
  console.log('\n--- Archiving old monthly prices ---')
  const oldPriceIds = [
    'pri_01kwqdq8xx7s4ptpp9gqyn9dms', // Starter old
    'pri_01kwqdq9a9hys36akt1yytyv1w', // Pro old
    'pri_01kwqdq945983ncpjpjndhvn0b', // Elite old
  ]

  for (const priceId of oldPriceIds) {
    try {
      await paddle.prices.archive(priceId)
      console.log(`  ✓ Archived: ${priceId}`)
    } catch (err) {
      console.log(`  ⚠ Could not archive ${priceId}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 4. Update .env.local
  console.log('\n--- Updating .env.local ---')
  const envPath = resolve(process.cwd(), '.env.local')
  let envContent = readFileSync(envPath, 'utf-8')

  // Remove old price IDs and add new ones
  const envUpdates = [
    // Starter
    { key: 'PADDLE_STARTER_MONTHLY_PRICE_ID', value: results.starter.monthlyPriceId },
    { key: 'PADDLE_STARTER_ANNUAL_PRICE_ID', value: results.starter.annualPriceId },
    { key: 'PADDLE_STARTER_PRODUCT_ID', value: results.starter.productId },
    // Pro
    { key: 'PADDLE_PRO_MONTHLY_PRICE_ID', value: results.pro.monthlyPriceId },
    { key: 'PADDLE_PRO_ANNUAL_PRICE_ID', value: results.pro.annualPriceId },
    { key: 'PADDLE_PRO_PRODUCT_ID', value: results.pro.productId },
    // Elite
    { key: 'PADDLE_ELITE_MONTHLY_PRICE_ID', value: results.elite.monthlyPriceId },
    { key: 'PADDLE_ELITE_ANNUAL_PRICE_ID', value: results.elite.annualPriceId },
    { key: 'PADDLE_ELITE_PRODUCT_ID', value: results.elite.productId },
  ]

  for (const { key, value } of envUpdates) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`)
    } else {
      envContent += `\n${key}=${value}`
    }
    console.log(`  ✓ ${key}=${value}`)
  }

  // Remove old price ID variables if they exist
  envContent = envContent
    .replace(/^PADDLE_PRO_PRICE_ID=.*$/m, '')
    .replace(/^PADDLE_ENTERPRISE_PRICE_ID=.*$/m, '')
    .replace(/^PADDLE_ENTERPRISE_PRODUCT_ID=.*$/m, '')

  writeFileSync(envPath, envContent)
  console.log('  ✓ .env.local updated!')

  // 5. Summary
  console.log('\n\n=== SUMMARY ===\n')
  console.log('Products & Prices Created:\n')

  for (const [planKey, data] of Object.entries(results)) {
    const plan = prices[planKey as keyof typeof prices]
    console.log(`${planKey.toUpperCase()}`)
    console.log(`  Product ID:   ${data.productId}`)
    console.log(`  Monthly:      ${data.monthlyPriceId}`)
    console.log(`                USD ${plan.monthly.label}`)
    console.log(`                GBP ${plan.gbp.monthly} | EUR ${plan.eur.monthly} | AUD ${plan.aud.monthly}`)
    console.log(`  Annual:       ${data.annualPriceId}`)
    console.log(`                USD ${plan.annual.label}`)
    console.log(`                GBP ${plan.gbp.annual} | EUR ${plan.eur.annual} | AUD ${plan.aud.annual}`)
    console.log(`  Trial:        7 days on all prices\n`)
  }

  console.log('Country Overrides (UK/IE/AU):')
  console.log('  Purchasing power adjusted:')
  console.log('  - UK (GBP): ~0.80x USD')
  console.log('  - Ireland (EUR): ~0.93x USD')
  console.log('  - Australia (AUD): ~1.53x USD')
  console.log('\nDone! All prices include 7-day free trial.')
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})