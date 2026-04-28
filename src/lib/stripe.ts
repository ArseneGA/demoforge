import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
})

export const PLANS = {
  free: {
    name: 'Free',
    price_monthly: 0,
    demos_per_month: 1,
    seats: 1,
    watermark: true,
  },
  forge: {
    name: 'Forge',
    price_monthly: 39,
    price_annual: 31,
    demos_per_month: 5,
    seats: 1,
    watermark: false,
  },
  studio: {
    name: 'Studio',
    price_monthly: 149,
    price_annual: 119,
    demos_per_month: 30,
    seats: 5,
    watermark: false,
    trial_days: 14,
  },
} as const

export type PlanKey = keyof typeof PLANS

// Map Stripe price ID → plan key
export function planFromPriceId(priceId: string): PlanKey {
  const map: Record<string, PlanKey> = {
    [process.env.STRIPE_PRICE_FORGE_MONTHLY ?? '']: 'forge',
    [process.env.STRIPE_PRICE_FORGE_ANNUAL ?? '']:  'forge',
    [process.env.STRIPE_PRICE_STUDIO_MONTHLY ?? '']: 'studio',
    [process.env.STRIPE_PRICE_STUDIO_ANNUAL ?? '']:  'studio',
  }
  return map[priceId] ?? 'free'
}
