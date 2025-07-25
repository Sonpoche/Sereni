// src/app/api/admin/users/stats/route.ts
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

    // Calculer les statistiques des utilisateurs
    const [
      totalUsers,
      totalClients,
      totalProfessionals,
      totalAdmins,
      incompleteProfiles,
      unverifiedEmails,
      newUsersThisMonth,
      activeUsers
    ] = await Promise.all([
      // Total des utilisateurs
      prisma.user.count(),
      
      // Utilisateurs par rôle
      prisma.user.count({
        where: { role: UserRole.CLIENT }
      }),
      
      prisma.user.count({
        where: { role: UserRole.PROFESSIONAL }
      }),
      
      prisma.user.count({
        where: { role: UserRole.ADMIN }
      }),
      
      // Profils incomplets
      prisma.user.count({
        where: { hasProfile: false }
      }),
      
      // Emails non vérifiés
      prisma.user.count({
        where: { emailVerified: null }
      }),
      
      // Nouveaux utilisateurs ce mois
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Utilisateurs actifs (profil complet ET email vérifié)
      prisma.user.count({
        where: {
          hasProfile: true,
          emailVerified: { not: null }
        }
      })
    ])

    // Statistiques par type de professionnel
    const professionalsByType = await prisma.professional.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    })

    // Utilisateurs avec abonnements actifs
    const usersWithActiveSubscriptions = await prisma.user.count({
      where: {
        subscription: {
          status: 'active'
        }
      }
    })

    // Croissance utilisateurs (comparaison avec le mois dernier)
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    
    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: thisMonthStart
        }
      }
    })

    const userGrowthRate = lastMonthUsers > 0 
      ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 
      : newUsersThisMonth > 0 ? 100 : 0

    // Taux de conversion (profil complété)
    const profileCompletionRate = totalUsers > 0 
      ? ((totalUsers - incompleteProfiles) / totalUsers) * 100 
      : 0

    // Taux de vérification email
    const emailVerificationRate = totalUsers > 0 
      ? ((totalUsers - unverifiedEmails) / totalUsers) * 100 
      : 0

    // Statistiques détaillées par rôle avec pourcentages
    const roleDistribution = {
      clients: {
        count: totalClients,
        percentage: totalUsers > 0 ? (totalClients / totalUsers) * 100 : 0
      },
      professionals: {
        count: totalProfessionals,
        percentage: totalUsers > 0 ? (totalProfessionals / totalUsers) * 100 : 0
      },
      admins: {
        count: totalAdmins,
        percentage: totalUsers > 0 ? (totalAdmins / totalUsers) * 100 : 0
      }
    }

    const stats = {
      // Statistiques de base
      total: totalUsers,
      clients: totalClients,
      professionals: totalProfessionals,
      admins: totalAdmins,
      incomplete: incompleteProfiles,
      unverified: unverifiedEmails,
      active: activeUsers,
      withSubscription: usersWithActiveSubscriptions,
      
      // Statistiques temporelles
      newThisMonth: newUsersThisMonth,
      newLastMonth: lastMonthUsers,
      growthRate: Math.round(userGrowthRate * 100) / 100,
      
      // Taux de conversion
      profileCompletionRate: Math.round(profileCompletionRate * 100) / 100,
      emailVerificationRate: Math.round(emailVerificationRate * 100) / 100,
      
      // Distribution par rôle
      roleDistribution,
      
      // Types de professionnels
      professionalTypes: professionalsByType.map(item => ({
        type: item.type,
        count: item._count.type
      })),
      
      // Métriques calculées
      metrics: {
        activeUserRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100 * 100) / 100 : 0,
        subscriptionRate: totalProfessionals > 0 ? Math.round((usersWithActiveSubscriptions / totalProfessionals) * 100 * 100) / 100 : 0,
        averageUsersPerDay: Math.round(newUsersThisMonth / new Date().getDate() * 100) / 100
      }
    }

    console.log("📊 [Admin] Statistiques utilisateurs calculées:", {
      total: stats.total,
      nouveaux: stats.newThisMonth,
      croissance: stats.growthRate + "%"
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error("❌ [Admin] Erreur calcul stats utilisateurs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}