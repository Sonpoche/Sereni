// Fichier: src/hooks/use-analytics.ts (VERSION FINALE CORRIGÉE)

import { useState, useCallback, useEffect } from 'react'

// Types pour les données analytiques
export interface MetriquesRevenus {
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

export interface MetriquesUtilisateurs {
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
}

export interface MetriquesRendezVous {
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

export interface AnalysesCohortes {
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

// Interface pour l'état du hook
interface EtatAnalytics {
  donneesRevenus: MetriquesRevenus | null
  donneesUtilisateurs: MetriquesUtilisateurs | null
  donneesRendezVous: MetriquesRendezVous | null
  donneesCohortes: AnalysesCohortes | null
  chargement: boolean
  erreur: string | null
  derniereMAJ: Date | null
}

// Options pour le hook
interface OptionsAnalytics {
  periode?: string
  actualiserAuto?: boolean
  intervalleActualisation?: number // en millisecondes
}

/**
 * Hook personnalisé pour la gestion des données analytiques admin
 * 
 * Fonctionnalités:
 * - Chargement des métriques depuis les APIs
 * - Gestion du cache et de l'actualisation automatique
 * - États de chargement et d'erreur
 * - Export des données
 * 
 * @param options - Configuration du hook
 * @returns État et fonctions pour gérer les analytics
 */
export function useAnalytics(options: OptionsAnalytics = {}) {
  const {
    periode = '12',
    actualiserAuto = false,
    intervalleActualisation = 300000 // 5 minutes par défaut
  } = options

  // État principal
  const [etat, setEtat] = useState<EtatAnalytics>({
    donneesRevenus: null,
    donneesUtilisateurs: null,
    donneesRendezVous: null,
    donneesCohortes: null,
    chargement: false,
    erreur: null,
    derniereMAJ: null
  })

  /**
   * Fonction pour charger les données depuis les APIs
   */
  const chargerDonnees = useCallback(async (periodeSelectionee?: string) => {
    try {
      setEtat(prev => ({ ...prev, chargement: true, erreur: null }))
      
      const periodeAUtiliser = periodeSelectionee || periode

      console.log('🔄 Chargement des données analytiques...', { periode: periodeAUtiliser })

      // Chargement parallèle de toutes les APIs
      const [reponseRevenus, reponseUtilisateurs, reponseRendezVous, reponseCohortes] = await Promise.all([
        fetch(`/api/admin/analytics/revenus?periode=${periodeAUtiliser}`),
        fetch(`/api/admin/analytics/utilisateurs?periode=${periodeAUtiliser}`),
        fetch(`/api/admin/analytics/rendez-vous?periode=${periodeAUtiliser}`),
        fetch(`/api/admin/analytics/cohortes?periode=${periodeAUtiliser}`)
      ])

      // Vérification des erreurs de réseau
      const erreurs = []
      if (!reponseRevenus.ok) erreurs.push('revenus')
      if (!reponseUtilisateurs.ok) erreurs.push('utilisateurs')
      if (!reponseRendezVous.ok) erreurs.push('rendez-vous')
      if (!reponseCohortes.ok) erreurs.push('cohortes')

      if (erreurs.length > 0) {
        throw new Error(`Erreur lors du chargement des données: ${erreurs.join(', ')}`)
      }

      // Parsing des réponses JSON
      const [donneesRevenus, donneesUtilisateurs, donneesRendezVous, donneesCohortes] = await Promise.all([
        reponseRevenus.json(),
        reponseUtilisateurs.json(),
        reponseRendezVous.json(),
        reponseCohortes.json()
      ])

      // Vérification de la structure des réponses
      if (!donneesRevenus.succes || !donneesUtilisateurs.succes || 
          !donneesRendezVous.succes || !donneesCohortes.succes) {
        throw new Error('Format de réponse invalide depuis les APIs')
      }

      // Mise à jour de l'état avec les nouvelles données
      setEtat({
        donneesRevenus: donneesRevenus.donnees,
        donneesUtilisateurs: donneesUtilisateurs.donnees,
        donneesRendezVous: donneesRendezVous.donnees,
        donneesCohortes: donneesCohortes.donnees,
        chargement: false,
        erreur: null,
        derniereMAJ: new Date()
      })

      console.log('✅ Données analytiques chargées avec succès', {
        revenus: donneesRevenus.donnees?.revenuTotal,
        utilisateurs: donneesUtilisateurs.donnees?.totalUtilisateurs,
        rendezVous: donneesRendezVous.donnees?.totalRendezVous
      })

    } catch (erreur) {
      console.error('❌ Erreur lors du chargement des analytics:', erreur)
      
      setEtat(prev => ({
        ...prev,
        chargement: false,
        erreur: erreur instanceof Error ? erreur.message : 'Erreur inconnue',
        derniereMAJ: new Date()
      }))
    }
  }, [periode])

  /**
   * Fonction pour actualiser les données
   */
  const actualiserDonnees = useCallback((nouvellePeriode?: string) => {
    return chargerDonnees(nouvellePeriode)
  }, [chargerDonnees])

  /**
   * Fonction pour réinitialiser l'état
   */
  const reinitialiser = useCallback(() => {
    setEtat({
      donneesRevenus: null,
      donneesUtilisateurs: null,
      donneesRendezVous: null,
      donneesCohortes: null,
      chargement: false,
      erreur: null,
      derniereMAJ: null
    })
  }, [])

  /**
   * Fonction pour exporter toutes les données
   */
  const exporterDonnees = useCallback(() => {
    if (!etat.donneesRevenus || !etat.donneesUtilisateurs || 
        !etat.donneesRendezVous || !etat.donneesCohortes) {
      throw new Error('Aucune donnée à exporter')
    }

    const donneesExport = {
      metadata: {
        periode,
        dateExport: new Date().toISOString(),
        derniereMAJ: etat.derniereMAJ?.toISOString()
      },
      revenus: etat.donneesRevenus,
      utilisateurs: etat.donneesUtilisateurs,
      rendezVous: etat.donneesRendezVous,
      cohortes: etat.donneesCohortes
    }

    // Création du fichier de téléchargement
    const blob = new Blob([JSON.stringify(donneesExport, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `analytics-serenibook-${new Date().toISOString().split('T')[0]}.json`
    
    document.body.appendChild(lien)
    lien.click()
    document.body.removeChild(lien)
    URL.revokeObjectURL(url)

    console.log('📊 Export des données analytiques réussi')
    return donneesExport
  }, [etat, periode])

  /**
   * Fonction pour obtenir un résumé des KPIs principaux
   */
  const obtenirResume = useCallback(() => {
    if (!etat.donneesRevenus || !etat.donneesUtilisateurs || !etat.donneesRendezVous) {
      return null
    }

    return {
      // KPIs financiers
      revenuTotal: etat.donneesRevenus.revenuTotal,
      mrr: etat.donneesRevenus.revenuRecurrent,
      croissanceRevenu: etat.donneesRevenus.croissancePercentage,
      
      // KPIs utilisateurs
      totalUtilisateurs: etat.donneesUtilisateurs.totalUtilisateurs,
      utilisateursActifs: etat.donneesUtilisateurs.utilisateursActifs,
      croissanceUtilisateurs: etat.donneesUtilisateurs.croissanceUtilisateurs,
      tauxActivation: etat.donneesUtilisateurs.tauxActivation,
      
      // KPIs opérationnels
      totalRendezVous: etat.donneesRendezVous.totalRendezVous,
      tauxConversion: etat.donneesRendezVous.tauxConversion,
      dureeRDVMoyenne: etat.donneesRendezVous.dureeRendezVousMoyenne,
      
      // KPIs avancés
      ltv: etat.donneesCohortes?.metriquesLTV.ltvMoyenne || 0,
      churn: etat.donneesCohortes?.analyseChurn.tauxChurnMensuel || 0
    }
  }, [etat])

  /**
   * Fonction pour vérifier si les données sont obsolètes
   */
  const donneesObsoletes = useCallback(() => {
    if (!etat.derniereMAJ) return true
    
    const maintenant = new Date()
    const diffMinutes = (maintenant.getTime() - etat.derniereMAJ.getTime()) / (1000 * 60)
    
    return diffMinutes > 30 // Considérer comme obsolètes après 30 minutes
  }, [etat.derniereMAJ])

  /**
   * Fonction pour obtenir le statut de santé des données
   */
  const statusSante = useCallback(() => {
    const resume = obtenirResume()
    if (!resume) return 'inconnu'
    
    // Calcul d'un score de santé basé sur les KPIs
    let score = 0
    let maxScore = 0
    
    // Croissance positive = bon signe
    if (resume.croissanceRevenu > 0) score += 20
    if (resume.croissanceUtilisateurs > 0) score += 20
    maxScore += 40
    
    // Taux de conversion élevé = bon signe  
    if (resume.tauxConversion >= 80) score += 15
    else if (resume.tauxConversion >= 60) score += 10
    else if (resume.tauxConversion >= 40) score += 5
    maxScore += 15
    
    // Churn faible = bon signe
    if (resume.churn <= 5) score += 15
    else if (resume.churn <= 10) score += 10
    else if (resume.churn <= 20) score += 5
    maxScore += 15
    
    // Taux d'activation élevé = bon signe
    if (resume.tauxActivation >= 80) score += 15
    else if (resume.tauxActivation >= 60) score += 10
    else if (resume.tauxActivation >= 40) score += 5
    maxScore += 15
    
    // Utilisateurs actifs proportionnellement élevé = bon signe
    const ratioActifs = resume.utilisateursActifs / resume.totalUtilisateurs
    if (ratioActifs >= 0.7) score += 15
    else if (ratioActifs >= 0.5) score += 10
    else if (ratioActifs >= 0.3) score += 5
    maxScore += 15
    
    const pourcentageScore = (score / maxScore) * 100
    
    if (pourcentageScore >= 80) return 'excellent'
    if (pourcentageScore >= 60) return 'bon'
    if (pourcentageScore >= 40) return 'moyen'
    return 'attention'
  }, [obtenirResume])

  // Configuration de l'actualisation automatique
  useEffect(() => {
    if (actualiserAuto && intervalleActualisation > 0) {
      const interval = setInterval(() => {
        if (donneesObsoletes()) {
          console.log('🔄 Actualisation automatique des données analytiques')
          chargerDonnees()
        }
      }, intervalleActualisation)

      return () => clearInterval(interval)
    }
  }, [actualiserAuto, intervalleActualisation, donneesObsoletes, chargerDonnees])

  // Retour de l'interface du hook
  return {
    // Données
    ...etat,
    
    // Actions
    chargerDonnees,
    actualiserDonnees,
    reinitialiser,
    exporterDonnees,
    
    // Utilitaires
    obtenirResume,
    donneesObsoletes,
    statusSante,
    
    // État calculé
    pret: !etat.chargement && !etat.erreur && etat.donneesRevenus !== null,
    vide: !etat.chargement && !etat.erreur && etat.donneesRevenus === null,
    
    // Métadonnées
    config: {
      periode,
      actualiserAuto,
      intervalleActualisation
    }
  }
}

// Hook simplifié pour une utilisation rapide
export function useAnalyticsSimple(periode: string = '12') {
  const analytics = useAnalytics({ periode })
  
  useEffect(() => {
    analytics.chargerDonnees()
  }, [periode])
  
  return analytics
}