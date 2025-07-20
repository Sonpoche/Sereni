// src/app/api/stripe/customer-portal/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/connexion', process.env.NEXTAUTH_URL!))
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true }
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.redirect(
        new URL('/parametres/abonnement?error=no_customer', process.env.NEXTAUTH_URL!)
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/parametres/abonnement`,
    })

    return NextResponse.redirect(portalSession.url)
  } catch (error) {
    console.error('Erreur portail client:', error)
    return NextResponse.redirect(
      new URL('/parametres/abonnement?error=portal_failed', process.env.NEXTAUTH_URL!)
    )
  }
}