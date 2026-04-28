import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, badRequest, serverError } from '@/lib/api'

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const { org_id } = await request.json()
  if (!org_id) return badRequest('org_id required')

  const member = await requireOrgMember(supabase, user.id, org_id, 'editor')
  if (!member) return forbidden()

  const svc = createServiceClient()
  const { data: org } = await svc
    .from('orgs')
    .select('stripe_customer_id')
    .eq('id', org_id)
    .single()

  if (!org?.stripe_customer_id) return badRequest('No Stripe customer found')

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
