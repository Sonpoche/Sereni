// Fichier: src/app/api/admin/analytics/utilisateurs/route.ts (VERSION CORRIGÉE)

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client' // ✅ Correction du chemin
import { auth } from '@/lib/auth/auth.config' // ✅ Utilisation de auth() au lieu de getServerSession

// Interface pour les métriques utilisateurs
interface MetriquesUtilisateurs {
  totalUtilisateurs: number
  nouveauxUtilisateurs: number
  utilisateursActifs: number
  croissanceUtilisateurs: number
  repartitionParRole: Array<{
    role: string
    nombre: number
    pourcentage: number
  }>
  evolutionUtilisateurs: Array<{
    mois: string
    annee: number
    nouveauxClients: number
    nouveauxProfessionnels: number
    totalNouveau: number
  }>
  professionnelsParType: Array<{
    type: string
    nombre: number
    pourcentage: number
  }>
  tauxActivation: number
  utilisateursParStatut: Array<{
    statut: string
    nombre: number
  }>
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

    console.log('🔍 Début récupération métriques utilisateurs admin')

    // Récupération des paramètres
    const { searchParams } = new URL(request.url)
    const periodeParam = searchParams.get('periode') || '12'
    const nombreMois = parseInt(periodeParam)

    // Calcul des dates
    const maintenant = new Date()
    const debutPeriode = new Date(maintenant.getFullYear(), maintenant.getMonth() - nombreMois + 1, 1)
    const debutMoisActuel = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    const debutMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)
    const finMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth(), 0, 23, 59, 59)

    console.log(`📅 Analyse période: ${nombreMois} mois depuis ${debutPeriode.toISOString()}`)

    // 1. Nombre total d'utilisateurs
    const totalUtilisateurs = await prisma.user.count()

    // 2. Nouveaux utilisateurs ce mois
    const nouveauxUtilisateurs = await prisma.user.count({
      where: {
        createdAt: { // ✅ Correction: 'createdAt' au lieu de 'dateCreation'
          gte: debutMoisActuel
        }
      }
    })

    // 3. Utilisateurs actifs (connectés dans les 30 derniers jours)
    const il30Jours = new Date()
    il30Jours.setDate(il30Jours.getDate() - 30)

    const utilisateursActifs = await prisma.user.count({
      where: {
        updatedAt: { // ✅ Correction: 'updatedAt' au lieu de 'derniereConnexion'
          gte: il30Jours
        }
      }
    })

    // 4. Croissance des utilisateurs (par rapport au mois précédent)
    const nouveauxMoisPrecedent = await prisma.user.count({
      where: {
        createdAt: { // ✅ Correction
          gte: debutMoisPrecedent,
          lte: finMoisPrecedent
        }
      }
    })

    const croissanceUtilisateurs = nouveauxMoisPrecedent > 0
      ? ((nouveauxUtilisateurs - nouveauxMoisPrecedent) / nouveauxMoisPrecedent) * 100
      : 0

    // 5. Répartition par rôle
    const repartitionParRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })

    const repartitionFormateePourcentage = repartitionParRole.map(item => {
      const nomRole = item.role === 'PROFESSIONAL' 
        ? 'Professionnels' 
        : item.role === 'CLIENT' 
          ? 'Clients' 
          : 'Administrateurs'
      
      return {
        role: nomRole,
        nombre: item._count,
        pourcentage: (item._count / totalUtilisateurs) * 100
      }
    })

    // 6. Évolution mensuelle des utilisateurs
    const evolutionUtilisateurs = await prisma.$queryRaw<Array<{
      mois: number
      annee: number
      role: string
      nombre: number
    }>>`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as mois,
        EXTRACT(YEAR FROM "createdAt") as annee,
        "role",
        COUNT(*) as nombre
      FROM "User"
      WHERE "createdAt" >= ${debutPeriode}
      GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt"), "role"
      ORDER BY annee ASC, mois ASC
    `

    // Formatage de l'évolution mensuelle
    const nomsMois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    // Regroupement par mois
    const evolutionParMois = new Map<string, {
      mois: string
      annee: number
      nouveauxClients: number
      nouveauxProfessionnels: number
      totalNouveau: number
    }>()

    evolutionUtilisateurs.forEach(item => {
      const cleDate = `${item.annee}-${item.mois}`
      const nomMois = nomsMois[item.mois - 1]
      
      if (!evolutionParMois.has(cleDate)) {
        evolutionParMois.set(cleDate, {
          mois: nomMois,
          annee: item.annee,
          nouveauxClients: 0,
          nouveauxProfessionnels: 0,
          totalNouveau: 0
        })
      }

      const donneesMois = evolutionParMois.get(cleDate)!
      const nombreUtilisateurs = Number(item.nombre)

      if (item.role === 'CLIENT') {
        donneesMois.nouveauxClients += nombreUtilisateurs
      } else if (item.role === 'PROFESSIONAL') {
        donneesMois.nouveauxProfessionnels += nombreUtilisateurs
      }
      
      donneesMois.totalNouveau += nombreUtilisateurs
    })

    const evolutionFormatee = Array.from(evolutionParMois.values())

    // 7. Professionnels par type de pratique
    const professionnelsParType = await prisma.professional.groupBy({
      by: ['type'],
      _count: true,
      where: {
        user: {
          role: 'PROFESSIONAL'
        }
      }
    })

    const totalProfessionnels = professionnelsParType.reduce((total, item) => total + item._count, 0)
    
    const professionnelsParTypeFormate = professionnelsParType.map(item => ({
      type: item.type || 'Non spécifié',
      nombre: item._count,
      pourcentage: totalProfessionnels > 0 ? (item._count / totalProfessionnels) * 100 : 0
    }))

    // 8. Taux d'activation des professionnels
    const professionnelsTotal = await prisma.user.count({
      where: { role: 'PROFESSIONAL' }
    })

    const professionnelsAvecServices = await prisma.user.count({
      where: {
        role: 'PROFESSIONAL',
        professionalProfile: {
          services: {
            some: {}
          }
        }
      }
    })

    const tauxActivation = professionnelsTotal > 0 
      ? (professionnelsAvecServices / professionnelsTotal) * 100 
      : 0

    // 9. Utilisateurs par statut d'abonnement
    const utilisateursParStatut = await prisma.$queryRaw<Array<{
      statut: string
      nombre: number
    }>>`
      SELECT 
        CASE 
          WHEN s."status" = 'active' THEN 'Abonné actif'
          WHEN s."status" = 'canceled' THEN 'Abonnement annulé'
          WHEN s."status" IS NULL THEN 'Pas d\'abonnement'
          ELSE s."status"
        END as statut,
        COUNT(*) as nombre
      FROM "User" u
      LEFT JOIN "Subscription" s ON u.id = s."userId"
      WHERE u.role = 'PROFESSIONAL'
      GROUP BY s."status"
    `

    const utilisateursParStatutFormate = utilisateursParStatut.map(item => ({
      statut: item.statut || 'Non défini',
      nombre: Number(item.nombre)
    }))

    // Construction de la réponse
    const metriques: MetriquesUtilisateurs = {
      totalUtilisateurs,
      nouveauxUtilisateurs,
      utilisateursActifs,
      croissanceUtilisateurs: Math.round(croissanceUtilisateurs * 100) / 100,
      repartitionParRole: repartitionFormateePourcentage,
      evolutionUtilisateurs: evolutionFormatee,
      professionnelsParType: professionnelsParTypeFormate,
      tauxActivation: Math.round(tauxActivation * 100) / 100,
      utilisateursParStatut: utilisateursParStatutFormate
    }

    console.log('✅ Métriques utilisateurs récupérées avec succès')
    console.log(`👥 Utilisateurs - Total: ${totalUtilisateurs}, Actifs: ${utilisateursActifs}`)

    return NextResponse.json({
      succes: true,
      donnees: metriques
    })

  } catch (erreur) {
    console.error('❌ Erreur lors de la récupération des métriques utilisateurs:', erreur)
    
    // ✅ Gestion correcte du type unknown
    const messageErreur = erreur instanceof Error ? erreur.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { 
        erreur: 'Erreur serveur lors de la récupération des métriques utilisateurs',
        details: process.env.NODE_ENV === 'development' ? messageErreur : undefined
      }, 
      { status: 500 }
    )
  }
}