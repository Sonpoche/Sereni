// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { handleStripeWebhook, stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    await handleStripeWebhook(event)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erreur webhook:', error.message)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}