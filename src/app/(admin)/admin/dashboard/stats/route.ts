// src/app/api/admin/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"

export async function GET() {
  try {
    const session = await auth()
    
    // Vérifier l'authentification admin
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 401 }
      )
    }

    // Dates pour les calculs
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // ==================== STATISTIQUES UTILISATEURS ====================
    const [
      totalUsers,
      totalClients,
      totalProfessionals,
      newUsersThisMonth,
      usersWithProfile
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.CLIENT } }),
      prisma.user.count({ where: { role: UserRole.PROFESSIONAL } }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.user.count({
        where: { hasProfile: true }
      })
    ])

    // ==================== STATISTIQUES ABONNEMENTS ====================
    const [
      activeSubscriptions,
      standardSubscriptions, 
      premiumSubscriptions,
      incompleteSubscriptions,
      canceledSubscriptions,
      pastDueSubscriptions
    ] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: 'active'
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'active',
          plan: 'standard'
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'active',
          plan: 'premium'
        }
      }),
      prisma.subscription.count({
        where: { status: 'incomplete' }
      }),
      prisma.subscription.count({
        where: { status: 'canceled' }
      }),
      prisma.subscription.count({
        where: { status: 'past_due' }
      })
    ])

    // ==================== CALCUL MRR ====================
    // MRR actuel (Monthly Recurring Revenue)
    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      select: { plan: true }
    })

    const currentMRR = activeSubs.reduce((total, sub) => {
      return total + (sub.plan === 'premium' ? 40 : 20)
    }, 0)

    // MRR du mois dernier pour calculer la croissance
    const lastMonthSubs = await prisma.subscription.findMany({
      where: {
        createdAt: { lte: endOfLastMonth },
        OR: [
          { 
            status: 'active',
            createdAt: { lte: endOfLastMonth }
          },
          {
            status: 'canceled',
            currentPeriodEnd: { gte: startOfLastMonth }
          }
        ]
      },
      select: { plan: true, status: true, currentPeriodEnd: true }
    })

    const lastMonthMRR = lastMonthSubs.reduce((total, sub) => {
      return total + (sub.plan === 'premium' ? 40 : 20)
    }, 0)

    const mrrGrowth = lastMonthMRR > 0 
      ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 
      : currentMRR > 0 ? 100 : 0

    // ==================== STATISTIQUES RENDEZ-VOUS ====================
    const [
      totalBookings,
      bookingsThisMonth,
      confirmedBookings,
      cancelledBookings,
      pendingBookings,
      completedBookings
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.booking.count({
        where: { status: 'CONFIRMED' }
      }),
      prisma.booking.count({
        where: { status: 'CANCELLED' }
      }),
      prisma.booking.count({
        where: { status: 'PENDING' }
      }),
      prisma.booking.count({
        where: { status: 'COMPLETED' }
      })
    ])

    // ==================== STATISTIQUES FACTURES ====================
    const [
      totalInvoices,
      invoicesThisMonth,
      paidInvoices,
      overDueInvoices
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.invoice.count({
        where: { status: 'PAID' }
      }),
      prisma.invoice.count({
        where: { 
          status: 'PENDING',
          dueDate: { lt: now }
        }
      })
    ])

    // ==================== ALERTES ET NOTIFICATIONS ====================
    const [
      pendingCancelations,
      failedPayments,
      expiringSoon,
      incompleteProfiles
    ] = await Promise.all([
      prisma.cancelationRequest.count({
        where: { status: 'pending' }
      }),
      prisma.subscription.count({
        where: { status: 'past_due' }
      }),
      prisma.subscription.count({
        where: {
          currentPeriodEnd: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          cancelAtPeriodEnd: true
        }
      }),
      prisma.user.count({
        where: { 
          hasProfile: false,
          role: { in: [UserRole.PROFESSIONAL, UserRole.CLIENT] }
        }
      })
    ])

    // ==================== CALCULS MÉTRIQUES BUSINESS ====================
    // Taux de churn approximatif
    const churnRate = activeSubscriptions > 0 
      ? (pendingCancelations / activeSubscriptions) * 100 
      : 0

    // Taux de conversion incomplete vers active
    const conversionRate = incompleteSubscriptions > 0 
      ? (activeSubscriptions / (activeSubscriptions + incompleteSubscriptions)) * 100
      : 100

    // Taux d'adoption Premium
    const premiumAdoptionRate = activeSubscriptions > 0
      ? (premiumSubscriptions / activeSubscriptions) * 100
      : 0

    // Revenue par utilisateur moyen (ARPU)
    const arpu = totalProfessionals > 0 ? currentMRR / totalProfessionals : 0

    // ==================== CONSTRUCTION RÉPONSE ====================
    const stats = {
      users: {
        total: totalUsers,
        clients: totalClients,
        professionals: totalProfessionals,
        newThisMonth: newUsersThisMonth,
        withProfile: usersWithProfile,
        incompleteProfiles
      },
      subscriptions: {
        total: activeSubscriptions,
        standard: standardSubscriptions,
        premium: premiumSubscriptions,
        incomplete: incompleteSubscriptions,
        canceled: canceledSubscriptions,
        pastDue: pastDueSubscriptions,
        mrr: currentMRR,
        churnRate: Math.round(churnRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        premiumAdoptionRate: Math.round(premiumAdoptionRate * 100) / 100,
        arpu: Math.round(arpu * 100) / 100
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        pending: pendingBookings,
        completed: completedBookings
      },
      invoices: {
        total: totalInvoices,
        thisMonth: invoicesThisMonth,
        paid: paidInvoices,
        overdue: overDueInvoices
      },
      revenue: {
        thisMonth: currentMRR,
        lastMonth: lastMonthMRR,
        growth: Math.round(mrrGrowth * 100) / 100,
        arpu
      },
      alerts: {
        cancelationRequests: pendingCancelations,
        failedPayments,
        expiringSoon,
        incompleteProfiles,
        overdueInvoices: overDueInvoices
      },
      metrics: {
        churnRate: Math.round(churnRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        premiumAdoptionRate: Math.round(premiumAdoptionRate * 100) / 100
      }
    }

    console.log("📊 [Admin Stats] Statistiques calculées:", {
      users: stats.users.total,
      subscriptions: stats.subscriptions.total,
      mrr: stats.subscriptions.mrr,
      alerts: stats.alerts.cancelationRequests
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error("❌ [Admin Stats] Erreur lors du calcul:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}