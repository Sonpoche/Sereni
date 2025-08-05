// src/app/api/admin/subscriptions/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe'
import { subDays, subMonths, format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

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
    const range = searchParams.get('range') || '30d'

    // Déterminer la période
    let startDate: Date
    let endDate = new Date()
    
    switch (range) {
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        break
      case '1y':
        startDate = subDays(endDate, 365)
        break
      default:
        startDate = subDays(endDate, 30)
    }

    // Générer les métriques
    const [
      mrrEvolution,
      planDistribution,
      churnAnalysis,
      revenueByMonth
    ] = await Promise.all([
      generateMRREvolution(startDate, endDate, range),
      generatePlanDistribution(),
      generateChurnAnalysis(),
      generateRevenueByMonth()
    ])

    const metrics = {
      mrrEvolution,
      planDistribution,
      churnAnalysis,
      revenueByMonth
    }

    return NextResponse.json({ metrics })

  } catch (error) {
    console.error('Erreur récupération métriques:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    )
  }
}

async function generateMRREvolution(startDate: Date, endDate: Date, range: string) {
  const data = []
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i <= days; i++) {
    const currentDate = subDays(endDate, days - i)
    
    // Récupérer les abonnements actifs à cette date
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: { lte: endOfDay(currentDate) },
        OR: [
          { updatedAt: { lt: startOfDay(currentDate) } },
          { status: { not: 'canceled' } }
        ]
      },
      select: { plan: true }
    })

    // Calculer le MRR
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan === 'premium' ? 40 : 20)
    }, 0)

    // Nouveaux abonnements ce jour
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: startOfDay(currentDate),
          lte: endOfDay(currentDate)
        }
      }
    })

    // Churn ce jour
    const churn = await prisma.subscription.count({
      where: {
        status: 'canceled',
        updatedAt: {
          gte: startOfDay(currentDate),
          lte: endOfDay(currentDate)
        }
      }
    })

    data.push({
      date: format(currentDate, range === '7d' ? 'dd/MM' : 'dd/MM', { locale: fr }),
      mrr: Math.round(mrr),
      newSubscriptions,
      churn
    })
  }

  return data
}

async function generatePlanDistribution() {
  const planCounts = await prisma.subscription.groupBy({
    by: ['plan'],
    where: { status: 'active' },
    _count: { plan: true }
  })

  const total = planCounts.reduce((sum, item) => sum + item._count.plan, 0)

  return planCounts.map(item => ({
    plan: item.plan === 'premium' ? 'Premium' : 'Standard',
    count: item._count.plan,
    percentage: Math.round((item._count.plan / total) * 100),
    mrr: item._count.plan * (item.plan === 'premium' ? 40 : 20)
  }))
}

async function generateChurnAnalysis() {
  const data = []
  
  // Analyser les 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i))
    const monthEnd = endOfMonth(subMonths(new Date(), i))
    
    // Abonnements actifs en début de mois
    const activeAtStart = await prisma.subscription.count({
      where: {
        status: 'active',
        createdAt: { lt: monthStart }
      }
    })

    // Annulations du mois
    const canceled = await prisma.subscription.count({
      where: {
        status: 'canceled',
        updatedAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    // Raisons d'annulation (depuis les demandes)
    const cancelationRequests = await prisma.cancelationRequest.findMany({
      where: {
        status: 'approved',
        processedAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: { reason: true }
    })

    // Grouper par raison
    const reasonCounts = cancelationRequests.reduce((acc, req) => {
      acc[req.reason] = (acc[req.reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const reasons = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count
    }))

    const churnRate = activeAtStart > 0 ? (canceled / activeAtStart) * 100 : 0

    data.push({
      month: format(monthStart, 'MMM', { locale: fr }),
      churnRate: Math.round(churnRate * 100) / 100,
      reasons: reasons.slice(0, 5) // Top 5 raisons
    })
  }

  return data
}

async function generateRevenueByMonth() {
  const data = []
  
  // Analyser les 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i))
    const monthEnd = endOfMonth(subMonths(new Date(), i))
    
    // Récupérer les abonnements actifs ce mois
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: { lte: monthEnd },
        OR: [
          { updatedAt: { lt: monthStart } },
          { status: { not: 'canceled' } }
        ]
      },
      select: { plan: true }
    })

    // Calculer les revenus
    const revenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan === 'premium' ? 40 : 20)
    }, 0)

    const subscriptions = activeSubscriptions.length
    const averageRevenue = subscriptions > 0 ? revenue / subscriptions : 0

    data.push({
      month: format(monthStart, 'MMM', { locale: fr }),
      revenue: Math.round(revenue),
      subscriptions,
      averageRevenue: Math.round(averageRevenue * 100) / 100
    })
  }

  return data
}