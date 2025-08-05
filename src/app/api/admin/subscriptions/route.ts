// src/app/api/admin/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const querySchema = z.object({
  status: z.enum(['active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'trialing']).optional(),
  plan: z.enum(['standard', 'premium']).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      status: searchParams.get('status') || undefined,
      plan: searchParams.get('plan') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined
    })

    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '50')
    const skip = (page - 1) * limit

    // Construire les filtres
    const where: any = {}
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.plan) {
      where.plan = query.plan
    }
    
    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } }
        ]
      }
    }

    // Récupérer les abonnements
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            },
            include: {
              professionalProfile: {
                select: {
                  type: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.subscription.count({ where })
    ])

    // Enrichir avec les données Stripe
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          // Vérifier que stripeSubscriptionId existe
          if (!sub.stripeSubscriptionId) {
            return createFallbackSubscription(sub)
          }

          // Récupérer les données Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId, {
            expand: ['latest_invoice']
          })
          
          // Vérifier que stripeCustomerId existe pour les factures
          let failedPayments = 0
          let totalPayments = 0
          let totalRevenue = 0
          let lastPaymentDate: string | null = null

          if (sub.stripeCustomerId) {
            // Récupérer l'historique des paiements
            const invoices = await stripe.invoices.list({
              customer: sub.stripeCustomerId,
              limit: 10
            })

            failedPayments = invoices.data.filter(inv => inv.status === 'open' || inv.status === 'uncollectible').length
            totalPayments = invoices.data.filter(inv => inv.status === 'paid').length
            totalRevenue = invoices.data
              .filter(inv => inv.status === 'paid')
              .reduce((sum, inv) => sum + (inv.amount_paid / 100), 0)
            
            if (invoices.data.length > 0 && invoices.data[0].created) {
              lastPaymentDate = new Date(invoices.data[0].created * 1000).toISOString()
            }
          }

          // Calculer les métriques
          const monthsActive = Math.ceil(
            (new Date().getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
          )
          const ltv = totalRevenue + (sub.plan === 'premium' ? 40 : 20) * 6 // Estimation 6 mois

          return {
            id: sub.id,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            stripeCustomerId: sub.stripeCustomerId || '',
            status: stripeSubscription.status,
            plan: sub.plan,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            mrr: sub.plan === 'premium' ? 40 : 20,
            user: {
              ...sub.user,
              professionalType: sub.user.professionalProfile?.type || null
            },
            payments: {
              total: totalPayments,
              failed: failedPayments,
              lastPayment: lastPaymentDate,
              nextPayment: new Date(stripeSubscription.current_period_end * 1000).toISOString()
            },
            metrics: {
              totalRevenue: Math.round(totalRevenue),
              monthsActive,
              ltv: Math.round(ltv)
            }
          }
        } catch (error) {
          console.error(`Erreur enrichissement abonnement ${sub.id}:`, error)
          return createFallbackSubscription(sub)
        }
      })
    )

    // Fonction helper pour créer des données de fallback
    function createFallbackSubscription(sub: any) {
      return {
        id: sub.id,
        stripeSubscriptionId: sub.stripeSubscriptionId || '',
        stripeCustomerId: sub.stripeCustomerId || '',
        status: sub.status,
        plan: sub.plan,
        currentPeriodStart: sub.currentPeriodStart?.toISOString() || new Date().toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        mrr: sub.plan === 'premium' ? 40 : 20,
        user: {
          ...sub.user,
          professionalType: sub.user.professionalProfile?.type || null
        },
        payments: {
          total: 0,
          failed: 0,
          lastPayment: null,
          nextPayment: sub.currentPeriodEnd?.toISOString() || new Date().toISOString()
        },
        metrics: {
          totalRevenue: 0,
          monthsActive: 0,
          ltv: 0
        }
      }
    }

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur récupération abonnements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des abonnements' },
      { status: 500 }
    )
  }
}