// src/app/api/admin/subscriptions/[id]/reactivate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'

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

    if (!subscription.stripeSubscriptionId || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'IDs Stripe manquants' },
        { status: 400 }
      )
    }

    // Réactiver dans Stripe
    if (subscription.cancelAtPeriodEnd) {
      // Annuler l'annulation programmée
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      })
    } else if (subscription.status === 'canceled') {
      // Créer un nouvel abonnement si nécessaire
      const priceId = STRIPE_PLANS[subscription.plan].monthly
      
      const newStripeSubscription = await stripe.subscriptions.create({
        customer: subscription.stripeCustomerId,
        items: [{ price: priceId }],
        metadata: {
          userId: subscription.userId,
          reactivatedBy: session.user.id
        }
      })

      // Mettre à jour l'ID Stripe
      await prisma.subscription.update({
        where: { id: params.id },
        data: {
          stripeSubscriptionId: newStripeSubscription.id,
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date(newStripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(newStripeSubscription.current_period_end * 1000)
        }
      })
    }

    // Mettre à jour dans la base de données
    const updatedSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: 'active',
        cancelAtPeriodEnd: false
      }
    })

    // Log de l'action admin
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'SUBSCRIPTION_REACTIVATED',
        details: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          userEmail: subscription.user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('Erreur réactivation abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réactivation' },
      { status: 500 }
    )
  }
}