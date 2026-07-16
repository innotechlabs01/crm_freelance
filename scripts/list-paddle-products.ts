import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const apiKey = process.env.PADDLE_SANDBOX_API_KEY
console.log('API Key found:', apiKey ? 'Yes (starts with ' + apiKey.substring(0, 10) + '...)' : 'No')
console.log('Environment:', Environment.sandbox)

const paddle = new Paddle(apiKey!, { environment: Environment.sandbox })

async function main() {
  console.log('\nListing all products in Paddle Sandbox...\n')

  try {
    const products = await paddle.products.list()
    
    const productList: any[] = []
    for await (const product of products) {
      productList.push(product)
    }

    if (productList.length === 0) {
      console.log('No products found in your Paddle sandbox account.')
      console.log('\nYou need to create the following products:')
      console.log('- Starter ($10/month, $100/year)')
      console.log('- Pro ($40/month, $400/year)')
      console.log('- Advanced ($120/month, $1200/year)')
      return
    }

    console.log(`Found ${productList.length} product(s):\n`)

    for (const product of productList) {
      console.log(`Product: ${product.name}`)
      console.log(`  ID: ${product.id}`)
      console.log(`  Description: ${product.description || 'N/A'}`)
      console.log(`  Tax Category: ${product.taxCategory}`)
      console.log(`  Status: ${product.status}`)
      console.log(`  Created: ${product.createdAt}`)
      console.log('')

      // List prices for this product
      try {
        const prices = await paddle.prices.list({ productId: [product.id] })
        const priceList: any[] = []
        for await (const price of prices) {
          priceList.push(price)
        }

        if (priceList.length === 0) {
          console.log('  No prices found for this product.\n')
          continue
        }

        for (const price of priceList) {
          console.log(`  Price: ${price.description || 'N/A'}`)
          console.log(`    ID: ${price.id}`)
          console.log(`    Amount: ${price.unitPrice.amount} ${price.unitPrice.currencyCode}`)
          console.log(`    Billing Cycle: ${price.billingCycle?.interval || 'N/A'} (every ${price.billingCycle?.frequency || 'N/A'})`)
          console.log(`    Trial Period: ${price.trialPeriod?.interval || 'None'} (${price.trialPeriod?.frequency || 'N/A'})`)
          if (price.unitPriceOverrides && price.unitPriceOverrides.length > 0) {
            console.log(`    Country Overrides:`)
            for (const override of price.unitPriceOverrides) {
              console.log(`      ${override.countryCodes.join(', ')}: ${override.unitPrice.amount} ${override.unitPrice.currencyCode}`)
            }
          }
          console.log('')
        }
      } catch (priceErr) {
        console.log(`  Error fetching prices: ${priceErr instanceof Error ? priceErr.message : String(priceErr)}\n`)
      }
    }
  } catch (err) {
    console.error('Error listing products:', err instanceof Error ? err.message : String(err))
    console.error('Full error:', err)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})