// src/app/api/stripe/subscription/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { getSubscription } from '@/lib/stripe'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { subscription, stripeData } = await getSubscription(session.user.id)

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        hasActiveSubscription: false
      })
    }

    // Calculer l'usage uniquement pour les professionnels
    let usage = { appointments: 0, clients: 0, services: 0, storage: 256 }
    
    if (session.user.role === 'PROFESSIONAL') {
      const [appointmentsCount, clientsCount, servicesCount] = await Promise.all([
        prisma.booking.count({
          where: {
            professionalId: session.user.id,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.professionalClient.count({
          where: { professionalId: session.user.id }
        }),
        prisma.service.count({
          where: { professionalId: session.user.id }
        })
      ])

      usage = {
        appointments: appointmentsCount,
        clients: clientsCount, 
        services: servicesCount,
        storage: 256 // Mock - à calculer réellement
      }
    }

    const limits = {
      appointments: null, // Illimité
      clients: null, // Illimité
      services: subscription.plan === 'premium' ? null : 10,
      storage: 1024
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        price: stripeData ? stripeData.items.data[0].price.unit_amount! / 100 : 0,
        currency: stripeData ? stripeData.items.data[0].price.currency : 'eur',
        interval: stripeData ? stripeData.items.data[0].price.recurring?.interval : 'month',
        currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
        trialEnd: subscription.trialEnd?.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        usage,
        limits
      },
      hasActiveSubscription: subscription.status === 'active'
    })
  } catch (error: any) {
    console.error('Erreur récupération abonnement:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}