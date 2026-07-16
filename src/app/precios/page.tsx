import { headers } from 'next/headers'
import { PricingPage } from '@/components/pricing/pricing-page'
import { tiers } from '@/config/tiers'

export default async function PreciosPage() {
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') || undefined

  return <PricingPage tiers={tiers} country={country} />
}
