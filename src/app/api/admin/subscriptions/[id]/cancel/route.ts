// src/app/api/admin/subscriptions/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const cancelSchema = z.object({
  immediately: z.boolean().optional().default(false)
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
    const { immediately } = cancelSchema.parse(body)

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

    // Annuler dans Stripe
    if (immediately) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    } else {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      })
    }

    // Mettre à jour dans la base de données
    const updatedSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: immediately ? 'canceled' : subscription.status,
        cancelAtPeriodEnd: !immediately ? true : subscription.cancelAtPeriodEnd
      }
    })

    // Log de l'action admin
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: immediately ? 'SUBSCRIPTION_CANCELED_IMMEDIATELY' : 'SUBSCRIPTION_CANCELED_AT_PERIOD_END',
        details: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          userEmail: subscription.user.email,
          immediately
        }
      }
    })

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('Erreur annulation abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation' },
      { status: 500 }
    )
  }
}