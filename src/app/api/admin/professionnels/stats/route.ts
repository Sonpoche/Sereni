// src/app/api/admin/professionals/stats/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { UserRole } from '@prisma/client'
import { ProfessionalType } from '@/types/professional'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Requêtes parallèles pour optimiser les performances
    const [
      totalProfessionals,
      activeProfessionals,
      newThisMonth,
      professionalsByType,
      professionalsBySubscription,
      profileCompletionStats,
      topPerformers,
      revenueByProfessional,
      engagementStats
    ] = await Promise.all([
      // Total des professionnels
      prisma.user.count({
        where: { 
          role: UserRole.PROFESSIONAL,
          professionalProfile: { isNot: null }
        }
      }),

      // Professionnels actifs (tous pour l'instant, pas de champ 'active')
      prisma.user.count({
        where: { 
          role: UserRole.PROFESSIONAL,
          professionalProfile: { isNot: null }
        }
      }),

      // Nouveaux ce mois
      prisma.user.count({
        where: {
          role: UserRole.PROFESSIONAL,
          professionalProfile: { isNot: null },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Répartition par type
      prisma.professional.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      }),

      // Répartition par plan d'abonnement
      prisma.professional.groupBy({
        by: ['subscriptionTier'],
        _count: { subscriptionTier: true }
      }),

      // Statistiques de complétion des profils
      prisma.$queryRaw<Array<{
        total: number;
        complete_profiles: number;
        incomplete_profiles: number;
      }>>`
        SELECT 
          COUNT(*)::int as total,
          COUNT(CASE WHEN pp.type IS NOT NULL AND pp.phone IS NOT NULL AND pp.bio IS NOT NULL THEN 1 END)::int as complete_profiles,
          COUNT(CASE WHEN pp.type IS NULL OR pp.phone IS NULL OR pp.bio IS NULL THEN 1 END)::int as incomplete_profiles
        FROM "users" u 
        LEFT JOIN "Professional" pp ON u.id = pp."userId"
        WHERE u.role = 'PROFESSIONAL' AND pp.id IS NOT NULL
      `,

      // Top performers (par nombre de RDV confirmés)
      prisma.$queryRaw<Array<{
        id: string;
        name: string;
        email: string;
        type: string;
        total_bookings: number;
        total_revenue: number;
      }>>`
        SELECT 
          u.id,
          u.name,
          u.email,
          pp.type,
          COUNT(b.id)::int as total_bookings,
          SUM(s.price)::float as total_revenue
        FROM "users" u
        LEFT JOIN "Professional" pp ON u.id = pp."userId"
        LEFT JOIN "Booking" b ON pp.id = b."professionalId" 
          AND b.status IN ('CONFIRMED', 'COMPLETED')
          AND b."startTime" > NOW() - INTERVAL '30 days'
        LEFT JOIN "Service" s ON b."serviceId" = s.id
        WHERE u.role = 'PROFESSIONAL' AND pp.id IS NOT NULL
        GROUP BY u.id, u.name, u.email, pp.type
        ORDER BY total_bookings DESC
        LIMIT 10
      `,

      // Revenus par professionnel (30 derniers jours)
      prisma.$queryRaw<Array<{
        date: Date;
        bookings: number;
        revenue: number;
        active_professionals: number;
      }>>`
        SELECT 
          DATE_TRUNC('day', b."startTime") as date,
          COUNT(b.id)::int as bookings,
          SUM(s.price)::float as revenue,
          COUNT(DISTINCT b."professionalId")::int as active_professionals
        FROM "Booking" b
        LEFT JOIN "Service" s ON b."serviceId" = s.id
        WHERE b.status IN ('CONFIRMED', 'COMPLETED')
          AND b."startTime" > NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', b."startTime")
        ORDER BY date DESC
      `,

      // Statistiques d'engagement (pas de lastLoginAt visible dans votre schéma)
      prisma.$queryRaw<Array<{
        active_7_days: number;
        active_30_days: number;
        inactive_30_days: number;
      }>>`
        SELECT 
          COUNT(CASE WHEN u."updatedAt" > NOW() - INTERVAL '7 days' THEN 1 END)::int as active_7_days,
          COUNT(CASE WHEN u."updatedAt" > NOW() - INTERVAL '30 days' THEN 1 END)::int as active_30_days,
          COUNT(CASE WHEN u."updatedAt" < NOW() - INTERVAL '30 days' OR u."updatedAt" IS NULL THEN 1 END)::int as inactive_30_days
        FROM "users" u
        LEFT JOIN "Professional" pp ON u.id = pp."userId"
        WHERE u.role = 'PROFESSIONAL' AND pp.id IS NOT NULL
      `
    ])

    // Calculs des métriques dérivées
    const profileCompletionData = Array.isArray(profileCompletionStats) && profileCompletionStats.length > 0
      ? profileCompletionStats[0] 
      : { total: 0, complete_profiles: 0, incomplete_profiles: 0 }

    const completionRate = profileCompletionData.total > 0 
      ? (profileCompletionData.complete_profiles / profileCompletionData.total) * 100 
      : 0

    // Calcul de la croissance mensuelle
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    
    const lastMonthNewProfessionals = await prisma.user.count({
      where: {
        role: UserRole.PROFESSIONAL,
        professionalProfile: { isNot: null },
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd
        }
      }
    })

    const growthRate = lastMonthNewProfessionals > 0 
      ? ((newThisMonth - lastMonthNewProfessionals) / lastMonthNewProfessionals) * 100 
      : newThisMonth > 0 ? 100 : 0

    // Calcul du taux d'activation (tous actifs pour l'instant)
    const activationRate = totalProfessionals > 0 
      ? (activeProfessionals / totalProfessionals) * 100 
      : 0

    // Préparation des données pour les graphiques avec typage
    const typeDistribution = professionalsByType.map((item: any) => ({
      type: item.type,
      count: item._count.type,
      percentage: totalProfessionals > 0 ? (item._count.type / totalProfessionals) * 100 : 0
    }))

    const subscriptionDistribution = professionalsBySubscription.map((item: any) => ({
      tier: item.subscriptionTier,
      count: item._count.subscriptionTier,
      percentage: totalProfessionals > 0 ? (item._count.subscriptionTier / totalProfessionals) * 100 : 0
    }))

    // Métriques de performance globale
    const totalRevenue30Days = Array.isArray(revenueByProfessional) 
      ? revenueByProfessional.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0)
      : 0

    const averageRevenuePerProfessional = activeProfessionals > 0 
      ? totalRevenue30Days / activeProfessionals 
      : 0

    return NextResponse.json({
      overview: {
        totalProfessionals,
        activeProfessionals,
        newThisMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        activationRate: Math.round(activationRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100
      },
      distribution: {
        byType: typeDistribution,
        bySubscription: subscriptionDistribution
      },
      performance: {
        totalRevenue30Days,
        averageRevenuePerProfessional: Math.round(averageRevenuePerProfessional * 100) / 100,
        topPerformers: topPerformers || [],
        revenueTimeline: revenueByProfessional || []
      },
      engagement: {
        active7Days: Array.isArray(engagementStats) ? engagementStats[0]?.active_7_days || 0 : 0,
        active30Days: Array.isArray(engagementStats) ? engagementStats[0]?.active_30_days || 0 : 0,
        inactive30Days: Array.isArray(engagementStats) ? engagementStats[0]?.inactive_30_days || 0 : 0
      },
      profileCompletion: {
        total: profileCompletionData.total || 0,
        complete: profileCompletionData.complete_profiles || 0,
        incomplete: profileCompletionData.incomplete_profiles || 0,
        completionRate: Math.round(completionRate * 100) / 100
      },
      alerts: {
        // Alertes pour l'admin
        incompleteProfiles: profileCompletionData.incomplete_profiles || 0,
        inactiveProfessionals: totalProfessionals - activeProfessionals,
        lowEngagement: Array.isArray(engagementStats) ? engagementStats[0]?.inactive_30_days || 0 : 0
      }
    })

  } catch (error) {
    console.error('❌ [Admin/Professionals Stats] Erreur:', error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}