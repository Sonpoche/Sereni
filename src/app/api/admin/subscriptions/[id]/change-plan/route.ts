// src/app/api/admin/subscriptions/[id]/change-plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import { z } from 'zod'

const changePlanSchema = z.object({
  plan: z.enum(['standard', 'premium'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { plan } = changePlanSchema.parse(body)

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'ID Stripe manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
    
    if (!stripeSubscription) {
      return NextResponse.json(
        { error: 'Abonnement Stripe non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le plan dans Stripe
    const newPriceId = STRIPE_PLANS[plan].monthly
    
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    })

    // Mettre à jour dans la base de données
    const updatedSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: { plan }
    })

    // Log de l'action admin
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'SUBSCRIPTION_PLAN_CHANGED',
        details: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          oldPlan: subscription.plan,
          newPlan: plan,
          userEmail: subscription.user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('Erreur changement de plan:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de plan' },
      { status: 500 }
    )
  }
}