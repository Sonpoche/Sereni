// Fichier: src/app/api/admin/analytics/rendez-vous/route.ts (VERSION FINALE CORRIGÉE)

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { auth } from '@/lib/auth/auth.config'
import { BookingStatus } from '@prisma/client'

// Interface pour les métriques de rendez-vous
interface MetriquesRendezVous {
  totalRendezVous: number
  rendezVousConfirmes: number
  rendezVousAnnules: number
  tauxConversion: number
  rendezVousParMois: Array<{
    mois: string
    annee: number
    total: number
    confirmes: number
    annules: number
    enAttente: number
  }>
  rendezVousParStatut: Array<{
    statut: string
    nombre: number
    pourcentage: number
  }>
  rendezVousParTypeService: Array<{
    typeService: string
    nombre: number
    revenuGenere: number
  }>
  creneauxPopulaires: Array<{
    heure: number
    nombre: number
  }>
  joursPopulaires: Array<{
    jour: string
    nombre: number
  }>
  dureeRendezVousMoyenne: number
  tempsAvantRendezVous: number
  professionnelsPlusActifs: Array<{
    nom: string
    email: string
    nombreRendezVous: number
    tauxConversion: number
  }>
}

// Types pour les requêtes SQL
interface StatutRendezVous {
  mois: number
  annee: number
  status: BookingStatus
  nombre: number
}

interface CreneauPopulaire {
  heure: number
  nombre: number
}

interface JourPopulaire {
  jourSemaine: number
  nombre: number
}

interface DureeMoyenne {
  dureeMoyenne: number
}

interface TempsMoyen {
  tempsMoyen: number
}

interface ProfessionnelActif {
  professionnelId: string
  nom: string
  email: string
  totalRendezVous: number
  rendezVousConfirmes: number
}

interface ServiceStats {
  typeService: string
  nombre: number
  revenuGenere: number
}

export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification et du rôle admin
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Accès non autorisé - Rôle requis: ADMIN')
      return NextResponse.json(
        { erreur: 'Accès non autorisé' }, 
        { status: 401 }
      )
    }

    console.log('🔍 Début récupération métriques rendez-vous admin')

    // Récupération des paramètres
    const { searchParams } = new URL(request.url)
    const periodeParam = searchParams.get('periode') || '12'
    const nombreMois = parseInt(periodeParam)

    // Calcul des dates
    const maintenant = new Date()
    const debutPeriode = new Date(maintenant.getFullYear(), maintenant.getMonth() - nombreMois + 1, 1)

    console.log(`📅 Analyse période: ${nombreMois} mois depuis ${debutPeriode.toISOString()}`)

    // 1. Statistiques globales des rendez-vous
    const totalRendezVous = await prisma.booking.count({
      where: {
        startTime: {
          gte: debutPeriode
        }
      }
    })

    const rendezVousConfirmes = await prisma.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        startTime: {
          gte: debutPeriode
        }
      }
    })

    const rendezVousAnnules = await prisma.booking.count({
      where: {
        status: BookingStatus.CANCELLED,
        startTime: {
          gte: debutPeriode
        }
      }
    })

    // 2. Calcul du taux de conversion
    const tauxConversion = totalRendezVous > 0 
      ? (rendezVousConfirmes / totalRendezVous) * 100 
      : 0

    // 3. Évolution des rendez-vous par mois
    const rendezVousParMoisRaw = await prisma.$queryRaw<Array<StatutRendezVous>>`
      SELECT 
        EXTRACT(MONTH FROM "startTime") as mois,
        EXTRACT(YEAR FROM "startTime") as annee,
        status,
        COUNT(*) as nombre
      FROM "Booking"
      WHERE "startTime" >= ${debutPeriode}
      GROUP BY EXTRACT(YEAR FROM "startTime"), EXTRACT(MONTH FROM "startTime"), status
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
      total: number
      confirmes: number
      annules: number
      enAttente: number
    }>()

    rendezVousParMoisRaw.forEach((item: StatutRendezVous) => {
      const cleDate = `${item.annee}-${item.mois}`
      const nomMois = nomsMois[item.mois - 1]
      
      if (!evolutionParMois.has(cleDate)) {
        evolutionParMois.set(cleDate, {
          mois: nomMois,
          annee: item.annee,
          total: 0,
          confirmes: 0,
          annules: 0,
          enAttente: 0
        })
      }

      const donneesMois = evolutionParMois.get(cleDate)!
      const nombre = Number(item.nombre)

      switch (item.status) {
        case BookingStatus.CONFIRMED:
          donneesMois.confirmes += nombre
          break
        case BookingStatus.CANCELLED:
          donneesMois.annules += nombre
          break
        case BookingStatus.PENDING:
          donneesMois.enAttente += nombre
          break
      }
      
      donneesMois.total += nombre
    })

    const rendezVousParMois = Array.from(evolutionParMois.values())

    // 4. Répartition par statut
    const rendezVousParStatutRaw = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        startTime: {
          gte: debutPeriode
        }
      },
      _count: true
    })

    const rendezVousParStatut = rendezVousParStatutRaw.map(item => {
      let statutTraduit: string
      switch (item.status) {
        case BookingStatus.PENDING: 
          statutTraduit = 'En attente'
          break
        case BookingStatus.CONFIRMED: 
          statutTraduit = 'Confirmé'
          break
        case BookingStatus.CANCELLED: 
          statutTraduit = 'Annulé'
          break
        case BookingStatus.COMPLETED: 
          statutTraduit = 'Terminé'
          break
        case BookingStatus.NO_SHOW: 
          statutTraduit = 'Absent'
          break
        default:
          statutTraduit = item.status
      }

      return {
        statut: statutTraduit,
        nombre: item._count,
        pourcentage: totalRendezVous > 0 ? (item._count / totalRendezVous) * 100 : 0
      }
    })

    // 5. Rendez-vous par type de service
    const rendezVousParTypeService = await prisma.$queryRaw<Array<ServiceStats>>`
      SELECT 
        COALESCE(s.name, 'Non spécifié') as "typeService",
        COUNT(b.id) as nombre,
        COALESCE(SUM(s.price), 0) as "revenuGenere"
      FROM "Booking" b
      LEFT JOIN "Service" s ON b."serviceId" = s.id
      WHERE b."startTime" >= ${debutPeriode}
      GROUP BY s.name
      ORDER BY nombre DESC
    `

    const rendezVousParTypeServiceFormate = rendezVousParTypeService.map((item: ServiceStats) => ({
      typeService: item.typeService || 'Service supprimé',
      nombre: Number(item.nombre),
      revenuGenere: Number(item.revenuGenere || 0)
    }))

    // 6. Créneaux horaires les plus populaires
    const creneauxPopulairesRaw = await prisma.$queryRaw<Array<CreneauPopulaire>>`
      SELECT 
        EXTRACT(HOUR FROM "startTime") as heure,
        COUNT(*) as nombre
      FROM "Booking"
      WHERE "startTime" >= ${debutPeriode}
        AND status IN ('CONFIRMED', 'COMPLETED')
      GROUP BY EXTRACT(HOUR FROM "startTime")
      ORDER BY nombre DESC
      LIMIT 12
    `

    const creneauxPopulaires = creneauxPopulairesRaw.map((item: CreneauPopulaire) => ({
      heure: Number(item.heure),
      nombre: Number(item.nombre)
    }))

    // 7. Jours de la semaine les plus populaires
    const joursPopulairesRaw = await prisma.$queryRaw<Array<JourPopulaire>>`
      SELECT 
        EXTRACT(DOW FROM "startTime") as "jourSemaine",
        COUNT(*) as nombre
      FROM "Booking"
      WHERE "startTime" >= ${debutPeriode}
        AND status IN ('CONFIRMED', 'COMPLETED')
      GROUP BY EXTRACT(DOW FROM "startTime")
      ORDER BY "jourSemaine"
    `

    const nomsJours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const joursPopulaires = joursPopulairesRaw.map((item: JourPopulaire) => ({
      jour: nomsJours[Number(item.jourSemaine)],
      nombre: Number(item.nombre)
    }))

    // 8. Durée moyenne des rendez-vous
    const dureesMoyennesRaw = await prisma.$queryRaw<Array<DureeMoyenne>>`
      SELECT 
        AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) / 60) as "dureeMoyenne"
      FROM "Booking"
      WHERE "startTime" >= ${debutPeriode}
        AND "endTime" IS NOT NULL
        AND status IN ('CONFIRMED', 'COMPLETED')
    `

    const dureeRendezVousMoyenne = dureesMoyennesRaw[0]?.dureeMoyenne 
      ? Math.round(Number(dureesMoyennesRaw[0].dureeMoyenne))
      : 60

    // 9. Temps moyen entre réservation et rendez-vous
    const tempsAvantRendezVousRaw = await prisma.$queryRaw<Array<TempsMoyen>>`
      SELECT 
        AVG(EXTRACT(EPOCH FROM ("startTime" - "createdAt")) / 3600) as "tempsMoyen"
      FROM "Booking"
      WHERE "startTime" >= ${debutPeriode}
        AND "createdAt" IS NOT NULL
        AND status IN ('CONFIRMED', 'COMPLETED')
    `

    const tempsAvantRendezVous = tempsAvantRendezVousRaw[0]?.tempsMoyen
      ? Math.round(Number(tempsAvantRendezVousRaw[0].tempsMoyen) * 10) / 10
      : 48

    // 10. Professionnels les plus actifs
    const professionnelsPlusActifsRaw = await prisma.$queryRaw<Array<ProfessionnelActif>>`
      SELECT 
        p.id as "professionnelId",
        COALESCE(u.name, 'Nom non renseigné') as nom,
        u.email,
        COUNT(b.id) as "totalRendezVous",
        COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) as "rendezVousConfirmes"
      FROM "Professional" p
      JOIN "User" u ON p."userId" = u.id
      LEFT JOIN "Booking" b ON p.id = b."professionalId" 
        AND b."startTime" >= ${debutPeriode}
      GROUP BY p.id, u.name, u.email
      HAVING COUNT(b.id) > 0
      ORDER BY "totalRendezVous" DESC
      LIMIT 10
    `

    const professionnelsPlusActifs = professionnelsPlusActifsRaw.map((item: ProfessionnelActif) => ({
      nom: item.nom || 'Nom non renseigné',
      email: item.email,
      nombreRendezVous: Number(item.totalRendezVous),
      tauxConversion: Number(item.totalRendezVous) > 0
        ? Math.round((Number(item.rendezVousConfirmes) / Number(item.totalRendezVous)) * 100 * 100) / 100
        : 0
    }))

    // Construction de la réponse
    const metriques: MetriquesRendezVous = {
      totalRendezVous,
      rendezVousConfirmes,
      rendezVousAnnules,
      tauxConversion: Math.round(tauxConversion * 100) / 100,
      rendezVousParMois,
      rendezVousParStatut,
      rendezVousParTypeService: rendezVousParTypeServiceFormate,
      creneauxPopulaires,
      joursPopulaires,
      dureeRendezVousMoyenne,
      tempsAvantRendezVous,
      professionnelsPlusActifs
    }

    console.log('✅ Métriques rendez-vous récupérées avec succès')
    console.log(`📅 RDV - Total: ${totalRendezVous}, Taux conversion: ${tauxConversion.toFixed(2)}%`)

    return NextResponse.json({
      succes: true,
      donnees: metriques
    })

  } catch (erreur) {
    console.error('❌ Erreur lors de la récupération des métriques rendez-vous:', erreur)
    
    const messageErreur = erreur instanceof Error ? erreur.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { 
        erreur: 'Erreur serveur lors de la récupération des métriques de rendez-vous',
        details: process.env.NODE_ENV === 'development' ? messageErreur : undefined
      }, 
      { status: 500 }
    )
  }
}