export interface Tier {
  name: 'Starter' | 'Pro' | 'Advanced'
  description: string
  features: string[]
  priceId: { month: string; year: string }
}

export const tiers: Tier[] = [
  {
    name: 'Starter',
    description: 'Ideal for getting started with client management.',
    features: [
      'Up to 5 active clients',
      '10 invoices per month',
      'Basic dashboard',
      'Payment tracking',
      'Email support',
    ],
    priceId: {
      month: process.env.PADDLE_STARTER_MONTHLY_PRICE_ID!,
      year: process.env.PADDLE_STARTER_ANNUAL_PRICE_ID!,
    },
  },
  {
    name: 'Pro',
    description: 'For freelancers who work consistently.',
    features: [
      'Unlimited clients',
      'Unlimited invoices',
      'No watermark',
      'Full financial CRM',
      'Payment records',
      'Cash flow tracking',
      'AI integration',
      'Automatic reminders',
      'Advanced reports',
      'Complete financial dashboard',
    ],
    priceId: {
      month: process.env.PADDLE_PRO_MONTHLY_PRICE_ID!,
      year: process.env.PADDLE_PRO_ANNUAL_PRICE_ID!,
    },
  },
  {
    name: 'Advanced',
    description: 'For teams and agencies with multiple collaborators.',
    features: [
      'Everything in Pro',
      'Multi-user',
      'Teams',
      'Roles and permissions',
      'White label',
      'Executive dashboard',
      'API access',
      'Priority support',
    ],
    priceId: {
      month: process.env.PADDLE_ADVANCED_MONTHLY_PRICE_ID!,
      year: process.env.PADDLE_ADVANCED_ANNUAL_PRICE_ID!,
    },
  },
]
