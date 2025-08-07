// Fichier: src/app/api/admin/analytics/revenus/route.ts (VERSION CORRIGÉE)

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client' // ✅ Correction du chemin
import { auth } from '@/lib/auth/auth.config' // ✅ Utilisation de auth() au lieu de getServerSession

// Interface pour les métriques de revenus
interface MetriquesRevenus {
  revenuTotal: number
  revenuMoisActuel: number
  revenuMoisPrecedent: number
  croissancePercentage: number
  revenuParMois: Array<{
    mois: string
    annee: number
    revenu: number
    nombreAbonnements: number
  }>
  revenuParPlan: Array<{
    plan: string
    revenu: number
    pourcentage: number
    nombreAbonnements: number
  }>
  revenuRecurrent: number
  churn: number
}

export async function GET(request: NextRequest) {
  try {
    // ✅ Vérification de l'authentification et du rôle admin
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Accès non autorisé - Rôle requis: ADMIN')
      return NextResponse.json(
        { erreur: 'Accès non autorisé' }, 
        { status: 401 }
      )
    }

    console.log('🔍 Début récupération métriques revenus admin')

    // Récupération des paramètres de date
    const { searchParams } = new URL(request.url)
    const periodeParam = searchParams.get('periode') || '12' // 12 mois par défaut
    const nombreMois = parseInt(periodeParam)

    // Calcul des dates
    const maintenant = new Date()
    const debutPeriode = new Date(maintenant.getFullYear(), maintenant.getMonth() - nombreMois + 1, 1)
    const debutMoisActuel = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    const debutMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)
    const finMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth(), 0, 23, 59, 59)

    console.log(`📅 Analyse période: ${nombreMois} mois depuis ${debutPeriode.toISOString()}`)

    // 1. Calcul du revenu total - Utilisation d'une approximation basée sur les abonnements
    const abonnementsActifs = await prisma.subscription.findMany({
      where: {
        status: 'active', // ✅ Correction: 'status' au lieu de 'statut'
        createdAt: { // ✅ Correction: 'createdAt' au lieu de 'dateCreation'
          gte: debutPeriode
        }
      }
    })

    // Calcul approximatif du revenu basé sur les plans
    const revenuTotal = abonnementsActifs.reduce((total, subscription) => {
      const montantMensuel = subscription.plan === 'premium' ? 29 : 19 // Prix approximatifs
      return total + montantMensuel
    }, 0)

    // 2. Revenu du mois actuel
    const abonnementsMoisActuel = await prisma.subscription.count({
      where: {
        status: 'active',
        createdAt: {
          gte: debutMoisActuel
        }
      }
    })
    const revenuMoisActuel = abonnementsMoisActuel * 24 // Moyenne des plans

    // 3. Revenu du mois précédent
    const abonnementsMoisPrecedent = await prisma.subscription.count({
      where: {
        status: 'active',
        createdAt: {
          gte: debutMoisPrecedent,
          lte: finMoisPrecedent
        }
      }
    })
    const revenuMoisPrecedent = abonnementsMoisPrecedent * 24

    // 4. Calcul de la croissance
    const croissancePercentage = revenuMoisPrecedent > 0 
      ? ((revenuMoisActuel - revenuMoisPrecedent) / revenuMoisPrecedent) * 100
      : 0

    // 5. Revenus par mois (approximation basée sur les abonnements)
    const abonnementsParMois = await prisma.$queryRaw<Array<{
      mois: number
      annee: number
      nombre: number
    }>>`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as mois,
        EXTRACT(YEAR FROM "createdAt") as annee,
        COUNT(*) as nombre
      FROM "Subscription"
      WHERE "status" = 'active'
        AND "createdAt" >= ${debutPeriode}
      GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
      ORDER BY annee ASC, mois ASC
    `

    // Formatage des noms de mois en français
    const nomsMois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    // Formatage avec calcul approximatif du revenu
    const revenuParMoisFormate = abonnementsParMois.map(item => ({
      mois: nomsMois[item.mois - 1],
      annee: item.annee,
      revenu: Number(item.nombre) * 24, // Prix moyen approximatif
      nombreAbonnements: Number(item.nombre)
    }))

    // 6. Répartition par plan
    const abonnementsParPlan = await prisma.subscription.groupBy({
      by: ['plan'],
      where: {
        status: 'active',
        createdAt: {
          gte: debutPeriode
        }
      },
      _count: true
    })

    const revenuParPlanFormate = abonnementsParPlan.map(item => {
      const revenuPlan = item._count * (item.plan === 'premium' ? 29 : 19)
      return {
        plan: item.plan === 'standard' ? 'Standard' : 'Premium',
        revenu: revenuPlan,
        pourcentage: revenuTotal > 0 ? (revenuPlan / revenuTotal) * 100 : 0,
        nombreAbonnements: item._count
      }
    })

    // 7. Calcul du MRR (Monthly Recurring Revenue)
    const abonnementsActifsMRR = await prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      select: {
        plan: true
      }
    })

    const revenuRecurrent = abonnementsActifsMRR.reduce((total, abonnement) => {
      const montantMensuel = abonnement.plan === 'premium' ? 29 : 19
      return total + montantMensuel
    }, 0)

    // 8. Calcul du taux de churn (approximatif)
    const abonnementsAnnulesRecemment = await prisma.subscription.count({
      where: {
        status: 'canceled',
        updatedAt: {
          gte: debutMoisPrecedent,
          lte: finMoisPrecedent
        }
      }
    })

    const totalAbonnementsDebutMois = await prisma.subscription.count({
      where: {
        createdAt: {
          lt: debutMoisPrecedent
        },
        OR: [
          { status: 'active' },
          { 
            status: 'canceled',
            updatedAt: {
              gt: debutMoisPrecedent
            }
          }
        ]
      }
    })

    const churn = totalAbonnementsDebutMois > 0 
      ? (abonnementsAnnulesRecemment / totalAbonnementsDebutMois) * 100
      : 0

    // Construction de la réponse
    const metriques: MetriquesRevenus = {
      revenuTotal,
      revenuMoisActuel,
      revenuMoisPrecedent,
      croissancePercentage: Math.round(croissancePercentage * 100) / 100,
      revenuParMois: revenuParMoisFormate,
      revenuParPlan: revenuParPlanFormate,
      revenuRecurrent: Math.round(revenuRecurrent * 100) / 100,
      churn: Math.round(churn * 100) / 100
    }

    console.log('✅ Métriques revenus récupérées avec succès')
    console.log(`📊 Revenus - Total: €${metriques.revenuTotal}, MRR: €${metriques.revenuRecurrent}`)

    return NextResponse.json({
      succes: true,
      donnees: metriques
    })

  } catch (erreur) {
    console.error('❌ Erreur lors de la récupération des métriques revenus:', erreur)
    
    // ✅ Gestion correcte du type unknown
    const messageErreur = erreur instanceof Error ? erreur.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { 
        erreur: 'Erreur serveur lors de la récupération des métriques de revenus',
        details: process.env.NODE_ENV === 'development' ? messageErreur : undefined
      }, 
      { status: 500 }
    )
  }
}