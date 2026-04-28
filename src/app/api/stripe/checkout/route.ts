import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, badRequest, serverError } from '@/lib/api'

const PRICE_MAP: Record<string, Record<string, string>> = {
  forge:  { monthly: process.env.STRIPE_PRICE_FORGE_MONTHLY ?? '', annual: process.env.STRIPE_PRICE_FORGE_ANNUAL ?? '' },
  studio: { monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY ?? '', annual: process.env.STRIPE_PRICE_STUDIO_ANNUAL ?? '' },
}

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const { org_id, plan, billing = 'monthly' } = await request.json()
  if (!org_id || !plan) return badRequest('org_id and plan required')
  if (!['forge', 'studio'].includes(plan)) return badRequest('Invalid plan')

  const member = await requireOrgMember(supabase, user.id, org_id, 'editor')
  if (!member) return forbidden()

  const priceId = PRICE_MAP[plan]?.[billing]
  if (!priceId) return serverError('Price not configured')

  const svc = createServiceClient()
  const { data: org } = await svc
    .from('orgs')
    .select('id, name, stripe_customer_id')
    .eq('id', org_id)
    .single()

  if (!org) return badRequest('Org not found')

  // Ensure Stripe customer exists
  let customerId = org.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { org_id },
    })
    customerId = customer.id
    await svc.from('orgs').update({ stripe_customer_id: customerId }).eq('id', org_id)
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    ...(plan === 'studio' ? { subscription_data: { trial_period_days: 14 } } : {}),
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
    metadata: { org_id },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
