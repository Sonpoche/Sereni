// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { priceId, successUrl, cancelUrl } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID requis' }, { status: 400 })
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      priceId,
      successUrl,
      cancelUrl
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Erreur checkout:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}