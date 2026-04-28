import { NextRequest, NextResponse } from 'next/server'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { createServiceClient } from '@/utils/supabase/service'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe/webhooks] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const svc = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.org_id
      if (!orgId || !session.subscription) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = subscription.items.data[0]?.price.id ?? ''
      const plan = planFromPriceId(priceId)

      await svc.from('orgs').update({
        plan,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
      }).eq('id', orgId)

      console.log(`[stripe] checkout completed → org ${orgId} → plan ${plan}`)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id ?? ''
      const plan = planFromPriceId(priceId)
      const customerId = sub.customer as string

      await svc.from('orgs').update({
        plan,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
      }).eq('stripe_customer_id', customerId)

      console.log(`[stripe] subscription updated → customer ${customerId} → plan ${plan}`)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await svc.from('orgs').update({
        plan: 'free',
        stripe_subscription_id: null,
        stripe_price_id: null,
      }).eq('stripe_customer_id', customerId)

      console.log(`[stripe] subscription deleted → customer ${customerId} → downgraded to free`)
      break
    }

    case 'invoice.paid': {
      // Could track payment events here for analytics
      break
    }

    default:
      // Ignore other events
      break
  }

  return NextResponse.json({ received: true })
}
