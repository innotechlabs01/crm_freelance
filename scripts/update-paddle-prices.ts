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

// Current product IDs (from .env.local)
const products = {
  starter: { id: process.env.PADDLE_STARTER_PRODUCT_ID!, name: 'Starter' },
  pro: { id: process.env.PADDLE_PRO_PRODUCT_ID!, name: 'Pro' },
  advanced: { id: process.env.PADDLE_ELITE_PRODUCT_ID!, name: 'Advanced' }, // Renaming Elite -> Advanced
}

// Old price IDs to archive (from .env.local)
const oldPriceIds = [
  process.env.PADDLE_STARTER_MONTHLY_PRICE_ID!,
  process.env.PADDLE_STARTER_ANNUAL_PRICE_ID!,
  process.env.PADDLE_PRO_MONTHLY_PRICE_ID!,
  process.env.PADDLE_PRO_ANNUAL_PRICE_ID!,
  process.env.PADDLE_ELITE_MONTHLY_PRICE_ID!,
  process.env.PADDLE_ELITE_ANNUAL_PRICE_ID!,
].filter(Boolean)

// New price configuration (in cents, as strings per Paddle docs)
const newPrices = {
  starter: {
    monthly: { amount: '1000', label: '$10/month' },
    annual: { amount: '10000', label: '$100/year' },
    gbp: { monthly: '799', annual: '7999', label: '£7.99/£79.99' },
    eur: { monthly: '929', annual: '9299', label: '€9.29/€92.99' },
    aud: { monthly: '1529', annual: '15299', label: 'A$15.29/A$152.99' },
  },
  pro: {
    monthly: { amount: '4000', label: '$40/month' },
    annual: { amount: '40000', label: '$400/year' },
    gbp: { monthly: '3199', annual: '31999', label: '£31.99/£319.99' },
    eur: { monthly: '3719', annual: '37199', label: '€37.19/€371.99' },
    aud: { monthly: '6119', annual: '61199', label: 'A$61.19/A$611.99' },
  },
  advanced: {
    monthly: { amount: '12000', label: '$120/month' },
    annual: { amount: '120000', label: '$1,200/year' },
    gbp: { monthly: '9499', annual: '94999', label: '£94.99/£949.99' },
    eur: { monthly: '11099', annual: '110999', label: '€110.99/€1,109.99' },
    aud: { monthly: '18299', annual: '182999', label: 'A$182.99/A$1,829.99' },
  },
}

async function main() {
  console.log('=== Updating Paddle Catalog ===\n')

  // 1. Rename Elite -> Advanced
  console.log('Renaming Elite -> Advanced...')
  try {
    await paddle.products.update(products.advanced.id, {
      name: 'Advanced',
      description: 'Advanced Plan - Everything in Pro + white label, API access, team management',
    })
    console.log(`  ✓ Renamed ${products.advanced.id} to Advanced`)
  } catch (err) {
    console.log(`  ⚠ Could not rename product: ${err instanceof Error ? err.message : String(err)}`)
  }

  // 2. Archive old prices
  console.log('\nArchiving old prices...')
  for (const priceId of oldPriceIds) {
    if (!priceId) continue
    try {
      await paddle.prices.archive(priceId)
      console.log(`  ✓ Archived: ${priceId}`)
    } catch (err) {
      console.log(`  ⚠ Could not archive ${priceId}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 3. Create new prices with correct amounts
  const results: Record<string, any> = {}

  for (const [planKey, product] of Object.entries(products)) {
    console.log(`\n--- ${product.name} (${product.id}) ---`)
    const planPrices = newPrices[planKey as keyof typeof newPrices]

    // Create Monthly price with trial + country overrides
    console.log('Creating monthly price with 7-day trial...')
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

    // Create Annual price with trial + country overrides
    console.log('Creating annual price with 7-day trial...')
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

    results[planKey] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    }
  }

  // 4. Update .env.local
  console.log('\n--- Updating .env.local ---')
  const envPath = resolve(process.cwd(), '.env.local')
  let envContent = readFileSync(envPath, 'utf-8')

  // Update Starter
  envContent = envContent
    .replace(/PADDLE_STARTER_MONTHLY_PRICE_ID=.*/, `PADDLE_STARTER_MONTHLY_PRICE_ID=${results.starter.monthlyPriceId}`)
    .replace(/PADDLE_STARTER_ANNUAL_PRICE_ID=.*/, `PADDLE_STARTER_ANNUAL_PRICE_ID=${results.starter.annualPriceId}`)

  // Update Pro
  envContent = envContent
    .replace(/PADDLE_PRO_MONTHLY_PRICE_ID=.*/, `PADDLE_PRO_MONTHLY_PRICE_ID=${results.pro.monthlyPriceId}`)
    .replace(/PADDLE_PRO_ANNUAL_PRICE_ID=.*/, `PADDLE_PRO_ANNUAL_PRICE_ID=${results.pro.annualPriceId}`)

  // Update Elite -> Advanced
  envContent = envContent
    .replace(/PADDLE_ELITE_MONTHLY_PRICE_ID=.*/, `PADDLE_ADVANCED_MONTHLY_PRICE_ID=${results.advanced.monthlyPriceId}`)
    .replace(/PADDLE_ELITE_ANNUAL_PRICE_ID=.*/, `PADDLE_ADVANCED_ANNUAL_PRICE_ID=${results.advanced.annualPriceId}`)
    .replace(/PADDLE_ELITE_PRODUCT_ID=.*/, `PADDLE_ADVANCED_PRODUCT_ID=${results.advanced.productId}`)

  // Remove old Elite vars if they still exist
  envContent = envContent
    .replace(/^PADDLE_ELITE_.*=.*$/m, '')

  writeFileSync(envPath, envContent)
  console.log('  ✓ .env.local updated!')

  // 5. Summary
  console.log('\n\n=== SUMMARY ===\n')
  console.log('Products & Prices Created:\n')

  for (const [planKey, data] of Object.entries(results)) {
    const plan = newPrices[planKey as keyof typeof newPrices]
    console.log(`${planKey.toUpperCase()}`)
    console.log(`  Product ID:   ${data.productId}`)
    console.log(`  Monthly:      ${data.monthlyPriceId}`)
    console.log(`                USD ${plan.monthly.label}`)
    console.log(`  Annual:       ${data.annualPriceId}`)
    console.log(`                USD ${plan.annual.label}`)
    console.log(`  Trial:        7 days on all prices\n`)
  }

  console.log('Country Overrides (UK/IE/AU):')
  console.log('  Purchasing power adjusted:')
  console.log('  - UK (GBP): ~0.799x USD')
  console.log('  - Ireland (EUR): ~0.929x USD')
  console.log('  - Australia (AUD): ~1.529x USD')
  console.log('\nDone! All prices include 7-day free trial.')
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
