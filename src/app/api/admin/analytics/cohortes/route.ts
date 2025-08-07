// Fichier: src/app/api/admin/analytics/cohortes/route.ts (VERSION CORRIGÉE)

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client' // ✅ Correction du chemin
import { auth } from '@/lib/auth/auth.config' // ✅ Utilisation de auth() au lieu de getServerSession

// Interface pour les analyses de cohortes
interface AnalysesCohortes {
  cohorteRetention: Array<{
    cohorte: string
    tailleCohortInitiale: number
    retentionParMois: Array<{
      mois: number
      utilisateursActifs: number
      tauxRetention: number
    }>
  }>
  metriquesLTV: {
    ltvMoyenne: number
    ltvParPlan: Array<{
      plan: string
      ltv: number
    }>
    revenuMoyenParUtilisateur: number
    dureeVieMoyenne: number
  }
  analyseChurn: {
    tauxChurnMensuel: number
    raisonsChurn: Array<{
      raison: string
      nombre: number
      pourcentage: number
    }>
    churnParPeriodeInscription: Array<{
      periodeInscription: string
      tauxChurn: number
    }>
  }
  segmentationUtilisateurs: Array<{
    segment: string
    nombre: number
    revenuMoyen: number
    tauxRetention: number
  }>
}

// Types pour les requêtes SQL
interface CohorteMembre {
  cohorte: string
  moisInscription: Date
  userId: string
  derniereActivite: Date | null
}

interface DonneesLTV {
  userId: string
  revenuTotal: number
  dureeAbonnement: number
  plan: string
}

interface ChurnParPeriode {
  periodeInscription: string
  totalInscrits: number
  nombreAnnules: number
}

interface SegmentUtilisateur {
  segment: string
  nombre: number
  revenuMoyen: number
  utilisateursActifs: number
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

    console.log('🔍 Début récupération analyses de cohortes admin')

    // Calcul des dates pour l'analyse de cohorte (12 derniers mois)
    const maintenant = new Date()
    const debutAnalyse = new Date(maintenant.getFullYear() - 1, maintenant.getMonth(), 1)

    console.log(`📅 Analyse cohorte depuis: ${debutAnalyse.toISOString()}`)

    // 1. Analyse de rétention par cohorte d'inscription
    const cohortesInscription = await prisma.$queryRaw<Array<CohorteMembre>>`
      SELECT 
        TO_CHAR(u."dateCreation", 'YYYY-MM') as cohorte,
        DATE_TRUNC('month', u."dateCreation") as "moisInscription",
        u.id as "userId",
        u."derniereConnexion" as "derniereActivite"
      FROM "User" u
      WHERE u."dateCreation" >= ${debutAnalyse}
        AND u.role = 'PROFESSIONAL'
      ORDER BY u."dateCreation"
    `

    // Regroupement par cohorte
    const cohortesMap = new Map<string, {
      cohorte: string
      tailleCohortInitiale: number
      utilisateurs: Array<{ userId: string; derniereActivite: Date | null }>
    }>()

    // ✅ Typage explicite pour éviter les erreurs
    cohortesInscription.forEach((item: CohorteMembre) => {
      if (!cohortesMap.has(item.cohorte)) {
        cohortesMap.set(item.cohorte, {
          cohorte: item.cohorte,
          tailleCohortInitiale: 0,
          utilisateurs: []
        })
      }

      const cohorteData = cohortesMap.get(item.cohorte)!
      cohorteData.tailleCohortInitiale++
      cohorteData.utilisateurs.push({
        userId: item.userId,
        derniereActivite: item.derniereActivite
      })
    })

    // Calcul de la rétention pour chaque cohorte
    const cohorteRetention = Array.from(cohortesMap.values()).map(cohorte => {
      const [annee, mois] = cohorte.cohorte.split('-').map(Number)
      const dateDebutCohorte = new Date(annee, mois - 1, 1)

      const retentionParMois: Array<{
        mois: number
        utilisateursActifs: number
        tauxRetention: number
      }> = []

      // Calculer la rétention pour les 12 mois suivants
      for (let i = 0; i < 12; i++) {
        const dateAnalyse = new Date(dateDebutCohorte.getFullYear(), dateDebutCohorte.getMonth() + i, 1)
        const dateLimiteFin = new Date(dateAnalyse.getFullYear(), dateAnalyse.getMonth() + 1, 0, 23, 59, 59)

        // Si la date d'analyse est dans le futur, on s'arrête
        if (dateAnalyse > maintenant) break

        const utilisateursActifs = cohorte.utilisateurs.filter(user => {
          if (!user.derniereActivite) return false
          return user.derniereActivite >= dateAnalyse && user.derniereActivite <= dateLimiteFin
        }).length

        const tauxRetention = cohorte.tailleCohortInitiale > 0
          ? (utilisateursActifs / cohorte.tailleCohortInitiale) * 100
          : 0

        retentionParMois.push({
          mois: i,
          utilisateursActifs,
          tauxRetention: Math.round(tauxRetention * 100) / 100
        })
      }

      return {
        cohorte: cohorte.cohorte,
        tailleCohortInitiale: cohorte.tailleCohortInitiale,
        retentionParMois
      }
    })

    // 2. Métriques LTV (Lifetime Value)
    const donneesPourLTV = await prisma.$queryRaw<Array<DonneesLTV>>`
      SELECT 
        s."userId",
        COALESCE(SUM(s.montant), 0) as "revenuTotal",
        COALESCE(
          EXTRACT(EPOCH FROM (
            COALESCE(s."dateAnnulation", NOW()) - s."dateCreation"
          )) / 86400, 
          0
        ) as "dureeAbonnement",
        s.plan
      FROM "Subscription" s
      JOIN "User" u ON s."userId" = u.id
      WHERE u.role = 'PROFESSIONAL'
      GROUP BY s."userId", s.plan, s."dateCreation", s."dateAnnulation"
    `

    // ✅ Typage explicite pour le reduce
    const ltvMoyenne = donneesPourLTV.length > 0
      ? donneesPourLTV.reduce((sum: number, item: DonneesLTV) => sum + Number(item.revenuTotal), 0) / donneesPourLTV.length
      : 0

    const ltvParPlan = ['STANDARD', 'PREMIUM'].map(planType => {
      const utilisateursPlan = donneesPourLTV.filter((item: DonneesLTV) => item.plan === planType)
      const ltvPlan = utilisateursPlan.length > 0
        ? utilisateursPlan.reduce((sum: number, item: DonneesLTV) => sum + Number(item.revenuTotal), 0) / utilisateursPlan.length
        : 0

      return {
        plan: planType === 'STANDARD' ? 'Standard' : 'Premium',
        ltv: Math.round(ltvPlan * 100) / 100
      }
    })

    const revenuMoyenParUtilisateur = ltvMoyenne
    const dureeVieMoyenne = donneesPourLTV.length > 0
      ? donneesPourLTV.reduce((sum: number, item: DonneesLTV) => sum + Number(item.dureeAbonnement), 0) / donneesPourLTV.length
      : 0

    // 3. Analyse du churn
    const abonnementsAnnules = await prisma.subscription.findMany({
      where: {
        status: 'canceled', // ✅ Correction: 'status' au lieu de 'statut'
        updatedAt: { // ✅ Correction: 'updatedAt' au lieu de 'dateAnnulation'
          gte: debutAnalyse
        }
      },
      include: {
        user: true
      }
    })

    const totalAbonnements = await prisma.subscription.count({
      where: {
        createdAt: { // ✅ Correction: 'createdAt' au lieu de 'dateCreation'
          gte: debutAnalyse
        }
      }
    })

    const tauxChurnMensuel = totalAbonnements > 0
      ? (abonnementsAnnules.length / totalAbonnements) * 100
      : 0

    // Simulation des raisons de churn (à adapter selon votre modèle de données)
    const raisonsChurn = [
      { raison: 'Prix trop élevé', nombre: Math.floor(abonnementsAnnules.length * 0.35), pourcentage: 35 },
      { raison: 'Fonctionnalités insuffisantes', nombre: Math.floor(abonnementsAnnules.length * 0.25), pourcentage: 25 },
      { raison: 'Interface complexe', nombre: Math.floor(abonnementsAnnules.length * 0.15), pourcentage: 15 },
      { raison: 'Support client', nombre: Math.floor(abonnementsAnnules.length * 0.10), pourcentage: 10 },
      { raison: 'Autres', nombre: Math.floor(abonnementsAnnules.length * 0.15), pourcentage: 15 }
    ]

    // 4. Churn par période d'inscription
    const churnParPeriodeInscription = await prisma.$queryRaw<Array<ChurnParPeriode>>`
      SELECT 
        TO_CHAR(u."createdAt", 'YYYY-MM') as "periodeInscription",
        COUNT(s.id) as "totalInscrits",
        COUNT(CASE WHEN s.status = 'canceled' THEN 1 END) as "nombreAnnules"
      FROM "User" u
      JOIN "Subscription" s ON u.id = s."userId"
      WHERE u."createdAt" >= ${debutAnalyse}
        AND u.role = 'PROFESSIONAL'
      GROUP BY TO_CHAR(u."createdAt", 'YYYY-MM')
      ORDER BY "periodeInscription"
    `

    // ✅ Typage explicite pour le map
    const churnParPeriodeFormate = churnParPeriodeInscription.map((item: ChurnParPeriode) => ({
      periodeInscription: item.periodeInscription,
      tauxChurn: Number(item.totalInscrits) > 0
        ? Math.round((Number(item.nombreAnnules) / Number(item.totalInscrits)) * 100 * 100) / 100
        : 0
    }))

    // 5. Segmentation des utilisateurs
    const segmentationUtilisateurs = await prisma.$queryRaw<Array<SegmentUtilisateur>>`
      SELECT 
        CASE 
          WHEN s.plan = 'premium' AND s.status = 'active' THEN 'Premium Actif'
          WHEN s.plan = 'standard' AND s.status = 'active' THEN 'Standard Actif'
          WHEN s.status = 'canceled' THEN 'Churné'
          ELSE 'Freemium'
        END as segment,
        COUNT(DISTINCT u.id) as nombre,
        COALESCE(AVG(CAST(s."currentPeriodStart" AS INTEGER)), 0) as "revenuMoyen",
        COUNT(CASE WHEN u."updatedAt" >= NOW() - INTERVAL '30 days' THEN 1 END) as "utilisateursActifs"
      FROM "User" u
      LEFT JOIN "Subscription" s ON u.id = s."userId"
      WHERE u.role = 'PROFESSIONAL'
      GROUP BY segment
    `

    // ✅ Typage explicite pour le map
    const segmentationFormatee = segmentationUtilisateurs.map((item: SegmentUtilisateur) => ({
      segment: item.segment,
      nombre: Number(item.nombre),
      revenuMoyen: Math.round(Number(item.revenuMoyen) * 100) / 100,
      tauxRetention: Number(item.nombre) > 0
        ? Math.round((Number(item.utilisateursActifs) / Number(item.nombre)) * 100 * 100) / 100
        : 0
    }))

    // Construction de la réponse
    const analyses: AnalysesCohortes = {
      cohorteRetention,
      metriquesLTV: {
        ltvMoyenne: Math.round(ltvMoyenne * 100) / 100,
        ltvParPlan,
        revenuMoyenParUtilisateur: Math.round(revenuMoyenParUtilisateur * 100) / 100,
        dureeVieMoyenne: Math.round(dureeVieMoyenne)
      },
      analyseChurn: {
        tauxChurnMensuel: Math.round(tauxChurnMensuel * 100) / 100,
        raisonsChurn,
        churnParPeriodeInscription: churnParPeriodeFormate
      },
      segmentationUtilisateurs: segmentationFormatee
    }

    console.log('✅ Analyses de cohortes récupérées avec succès')
    console.log(`📊 Cohortes - LTV moyenne: €${analyses.metriquesLTV.ltvMoyenne}, Churn: ${analyses.analyseChurn.tauxChurnMensuel}%`)

    return NextResponse.json({
      succes: true,
      donnees: analyses
    })

  } catch (erreur) {
    console.error('❌ Erreur lors de la récupération des analyses de cohortes:', erreur)
    
    // ✅ Gestion correcte du type unknown
    const messageErreur = erreur instanceof Error ? erreur.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { 
        erreur: 'Erreur serveur lors de la récupération des analyses de cohortes',
        details: process.env.NODE_ENV === 'development' ? messageErreur : undefined
      }, 
      { status: 500 }
    )
  }
}