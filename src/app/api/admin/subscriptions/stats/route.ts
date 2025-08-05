// src/app/api/admin/subscriptions/stats/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe'
import { subDays, startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Récupérer toutes les données nécessaires
    const [
      totalSubscriptions,
      activeSubscriptions,
      canceledThisMonth,
      allActiveSubscriptions
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({
        where: {
          status: 'canceled',
          updatedAt: {
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date())
          }
        }
      }),
      prisma.subscription.findMany({
        where: { status: 'active' },
        select: { plan: true, stripeSubscriptionId: true, createdAt: true }
      })
    ])

    // Calculer le MRR
    const totalMRR = allActiveSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan === 'premium' ? 40 : 20)
    }, 0)

    // Calculer la croissance MRR (comparaison avec le mois dernier)
    const lastMonthStart = startOfMonth(subDays(new Date(), 30))
    const lastMonthEnd = endOfMonth(subDays(new Date(), 30))
    
    const lastMonthActiveSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: { lte: lastMonthEnd }
      },
      select: { plan: true }
    })

    const lastMonthMRR = lastMonthActiveSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan === 'premium' ? 40 : 20)
    }, 0)

    const mrrGrowth = lastMonthMRR > 0 ? ((totalMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0

    // Calculer le taux de churn (annulations du mois / abonnements actifs début de mois)
    const startOfMonthActiveCount = await prisma.subscription.count({
      where: {
        status: 'active',
        createdAt: { lt: startOfMonth(new Date()) }
      }
    })
    
    const churnRate = startOfMonthActiveCount > 0 ? (canceledThisMonth / startOfMonthActiveCount) * 100 : 0

    // Calculer la LTV moyenne
    const averageLTV = allActiveSubscriptions.length > 0 
      ? allActiveSubscriptions.reduce((sum, sub) => {
          const monthsActive = Math.max(1, Math.ceil(
            (new Date().getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
          ))
          const monthlyValue = sub.plan === 'premium' ? 40 : 20
          return sum + (monthlyValue * monthsActive * 1.5) // Estimation LTV
        }, 0) / allActiveSubscriptions.length
      : 0

    // Compter les paiements échoués (simulé pour tests sans Stripe)
    let failedPayments = 0
    try {
      // Compter les abonnements avec statut past_due comme proxy pour les paiements échoués
      failedPayments = await prisma.subscription.count({
        where: { status: 'past_due' }
      })
    } catch (error) {
      console.error('Erreur calcul paiements échoués:', error)
      failedPayments = 0
    }

    const stats = {
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions: canceledThisMonth,
      totalMRR: Math.round(totalMRR),
      mrrGrowth: Math.round(mrrGrowth * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      averageLTV: Math.round(averageLTV),
      failedPayments
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Erreur récupération statistiques:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}