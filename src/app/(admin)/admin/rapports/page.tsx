// Fichier: src/app/(admin)/admin/rapports/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Calendar, Euro, Activity,
  Download, RefreshCw, AlertCircle, Target, Clock, Award
} from 'lucide-react'

// Interfaces pour les données
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
}

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
  }
  segmentationUtilisateurs: Array<{
    segment: string
    nombre: number
    revenuMoyen: number
    tauxRetention: number
  }>
}

// Couleurs pour les graphiques
const COULEURS_GRAPHIQUE = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5a2b', '#6366f1']

export default function PageRapports() {
  // États pour les données
  const [donneesRevenus, setDonneesRevenus] = useState<MetriquesRevenus | null>(null)
  const [donneesUtilisateurs, setDonneesUtilisateurs] = useState<MetriquesUtilisateurs | null>(null)
  const [donneesRendezVous, setDonneesRendezVous] = useState<MetriquesRendezVous | null>(null)
  const [donneesCohortes, setDonneesCohortes] = useState<AnalysesCohortes | null>(null)

  // États UI
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState('12')
  const [ongletActif, setOngletActif] = useState('vue-ensemble')

  // Fonction pour charger toutes les données
  const chargerDonnees = async () => {
    try {
      setChargement(true)
      setErreur(null)

      console.log('🔄 Chargement des données analytiques...')

      // Chargement parallèle de toutes les APIs
      const [reponseRevenus, reponseUtilisateurs, reponseRendezVous, reponseCohortes] = await Promise.all([
        fetch(`/api/admin/analytics/revenus?periode=${periodeSelectionnee}`),
        fetch(`/api/admin/analytics/utilisateurs?periode=${periodeSelectionnee}`),
        fetch(`/api/admin/analytics/rendez-vous?periode=${periodeSelectionnee}`),
        fetch(`/api/admin/analytics/cohortes?periode=${periodeSelectionnee}`)
      ])

      // Vérification des erreurs
      if (!reponseRevenus.ok || !reponseUtilisateurs.ok || !reponseRendezVous.ok || !reponseCohortes.ok) {
        throw new Error('Erreur lors du chargement des données analytiques')
      }

      // Parsing des réponses
      const [revenus, utilisateurs, rendezVous, cohortes] = await Promise.all([
        reponseRevenus.json(),
        reponseUtilisateurs.json(),
        reponseRendezVous.json(),
        reponseCohortes.json()
      ])

      // Mise à jour des états
      setDonneesRevenus(revenus.donnees)
      setDonneesUtilisateurs(utilisateurs.donnees)
      setDonneesRendezVous(rendezVous.donnees)
      setDonneesCohortes(cohortes.donnees)

      console.log('✅ Données analytiques chargées avec succès')

    } catch (erreur) {
      console.error('❌ Erreur lors du chargement des données:', erreur)
      setErreur('Impossible de charger les données analytiques')
    } finally {
      setChargement(false)
    }
  }

  // Chargement initial et lors du changement de période
  useEffect(() => {
    chargerDonnees()
  }, [periodeSelectionnee])

  // Fonction d'export des données
  const exporterRapport = async () => {
    try {
      console.log('📊 Export du rapport analytique...')
      
      const donneesExport = {
        periode: periodeSelectionnee,
        dateGeneration: new Date().toISOString(),
        revenus: donneesRevenus,
        utilisateurs: donneesUtilisateurs,
        rendezVous: donneesRendezVous,
        cohortes: donneesCohortes
      }

      const blob = new Blob([JSON.stringify(donneesExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const lien = document.createElement('a')
      lien.href = url
      lien.download = `rapport-serenibook-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(lien)
      lien.click()
      document.body.removeChild(lien)
      URL.revokeObjectURL(url)

      console.log('✅ Rapport exporté avec succès')
    } catch (erreur) {
      console.error('❌ Erreur lors de l\'export:', erreur)
    }
  }

  // Composant de carte métrique
  const CarteMetrique = ({ 
    titre, 
    valeur, 
    tendance, 
    icone: Icone, 
    couleur = "blue",
    formatage = "nombre"
  }: {
    titre: string
    valeur: number
    tendance?: number
    icone: any
    couleur?: string
    formatage?: "nombre" | "euro" | "pourcentage" | "duree"
  }) => {
    const formaterValeur = (val: number) => {
      switch (formatage) {
        case "euro":
          return `€${val.toLocaleString('fr-FR')}`
        case "pourcentage":
          return `${val}%`
        case "duree":
          return `${val}h`
        default:
          return val.toLocaleString('fr-FR')
      }
    }

    const couleurClasse = {
      blue: "border-blue-200 bg-blue-50",
      green: "border-green-200 bg-green-50", 
      purple: "border-purple-200 bg-purple-50",
      orange: "border-orange-200 bg-orange-50"
    }[couleur] || "border-blue-200 bg-blue-50"

    const couleurIcone = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600", 
      orange: "text-orange-600"
    }[couleur] || "text-blue-600"

    return (
      <Card className={`${couleurClasse} border`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{titre}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formaterValeur(valeur)}
              </p>
              {tendance !== undefined && (
                <div className="flex items-center space-x-1">
                  {tendance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    tendance >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {tendance >= 0 ? '+' : ''}{tendance}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${couleurIcone} bg-white/50`}>
              <Icone className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Affichage de chargement
  if (chargement) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
            <p className="text-lg font-medium text-gray-600">
              Chargement des analyses...
            </p>
            <p className="text-sm text-gray-500">
              Récupération des métriques de performance
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Affichage d'erreur
  if (erreur) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="space-y-1">
                <h3 className="font-medium text-red-800">Erreur de chargement</h3>
                <p className="text-sm text-red-600">{erreur}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={chargerDonnees}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Analyses détaillées des performances de SereniBook
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={periodeSelectionnee} onValueChange={setPeriodeSelectionnee}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 derniers mois</SelectItem>
              <SelectItem value="6">6 derniers mois</SelectItem>
              <SelectItem value="12">12 derniers mois</SelectItem>
              <SelectItem value="24">24 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exporterRapport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
          <Button onClick={chargerDonnees}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs value={ongletActif} onValueChange={setOngletActif} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vue-ensemble">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenus">Revenus</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="rendez-vous">Rendez-vous</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="vue-ensemble" className="space-y-6">
          {/* Métriques clés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CarteMetrique
              titre="Revenu total"
              valeur={donneesRevenus?.revenuTotal || 0}
              tendance={donneesRevenus?.croissancePercentage}
              icone={Euro}
              couleur="green"
              formatage="euro"
            />
            
            <CarteMetrique
              titre="Utilisateurs actifs"
              valeur={donneesUtilisateurs?.utilisateursActifs || 0}
              tendance={donneesUtilisateurs?.croissanceUtilisateurs}
              icone={Users}
              couleur="blue"
            />
            
            <CarteMetrique
              titre="Rendez-vous confirmés"
              valeur={donneesRendezVous?.rendezVousConfirmes || 0}
              icone={Calendar}
              couleur="purple"
            />
            
            <CarteMetrique
              titre="Taux de conversion"
              valeur={donneesRendezVous?.tauxConversion || 0}
              icone={Target}
              couleur="orange"
              formatage="pourcentage"
            />
          </div>

          {/* KPIs avancés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>MRR (Revenu Récurrent)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  €{(donneesRevenus?.revenuRecurrent || 0).toLocaleString('fr-FR')}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Revenu mensuel récurrent moyen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span>LTV Moyenne</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  €{(donneesCohortes?.metriquesLTV.ltvMoyenne || 0).toLocaleString('fr-FR')}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Valeur vie client moyenne
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span>Temps avant RDV</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {donneesRendezVous?.tempsAvantRendezVous || 0}h
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Délai moyen réservation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques de tendances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des revenus */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={donneesRevenus?.revenuParMois || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`€${value}`, 'Revenu']}
                      labelFormatter={(label) => `Mois: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenu" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Évolution des utilisateurs */}
            <Card>
              <CardHeader>
                <CardTitle>Croissance des Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={donneesUtilisateurs?.evolutionUtilisateurs || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="nouveauxClients" 
                      stroke="#10b981" 
                      name="Nouveaux clients"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nouveauxProfessionnels" 
                      stroke="#8b5cf6" 
                      name="Nouveaux professionnels"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Section Revenus */}
        <TabsContent value="revenus" className="space-y-6">
          {/* Métriques de revenus */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CarteMetrique
              titre="Revenu total"
              valeur={donneesRevenus?.revenuTotal || 0}
              icone={Euro}
              couleur="green"
              formatage="euro"
            />
            
            <CarteMetrique
              titre="Revenu ce mois"
              valeur={donneesRevenus?.revenuMoisActuel || 0}
              tendance={donneesRevenus?.croissancePercentage}
              icone={TrendingUp}
              couleur="blue"
              formatage="euro"
            />
            
            <CarteMetrique
              titre="MRR"
              valeur={donneesRevenus?.revenuRecurrent || 0}
              icone={Activity}
              couleur="purple"
              formatage="euro"
            />
            
            <CarteMetrique
              titre="Churn"
              valeur={donneesRevenus?.churn || 0}
              icone={TrendingDown}
              couleur="orange"
              formatage="pourcentage"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique revenus par mois */}
            <Card>
              <CardHeader>
                <CardTitle>Revenus par Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={donneesRevenus?.revenuParMois || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}`, 'Revenu']} />
                    <Bar dataKey="revenu" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par plan */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={donneesRevenus?.revenuParPlan || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ plan, pourcentage }) => `${plan}: ${pourcentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenu"
                    >
                      {(donneesRevenus?.revenuParPlan || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COULEURS_GRAPHIQUE[index % COULEURS_GRAPHIQUE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`€${value}`, 'Revenu']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Section Utilisateurs */}
        <TabsContent value="utilisateurs" className="space-y-6">
          {/* Métriques utilisateurs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CarteMetrique
              titre="Total utilisateurs"
              valeur={donneesUtilisateurs?.totalUtilisateurs || 0}
              icone={Users}
              couleur="blue"
            />
            
            <CarteMetrique
              titre="Nouveaux ce mois"
              valeur={donneesUtilisateurs?.nouveauxUtilisateurs || 0}
              tendance={donneesUtilisateurs?.croissanceUtilisateurs}
              icone={TrendingUp}
              couleur="green"
            />
            
            <CarteMetrique
              titre="Utilisateurs actifs"
              valeur={donneesUtilisateurs?.utilisateursActifs || 0}
              icone={Activity}
              couleur="purple"
            />
            
            <CarteMetrique
              titre="Taux activation"
              valeur={donneesUtilisateurs?.tauxActivation || 0}
              icone={Target}
              couleur="orange"
              formatage="pourcentage"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par rôle */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Rôle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={donneesUtilisateurs?.repartitionParRole || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, pourcentage }) => `${role}: ${pourcentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="nombre"
                    >
                      {(donneesUtilisateurs?.repartitionParRole || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COULEURS_GRAPHIQUE[index % COULEURS_GRAPHIQUE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Professionnels par type */}
            <Card>
              <CardHeader>
                <CardTitle>Professionnels par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={donneesUtilisateurs?.professionnelsParType || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="nombre" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Section Rendez-vous */}
        <TabsContent value="rendez-vous" className="space-y-6">
          {/* Métriques rendez-vous */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CarteMetrique
              titre="Total RDV"
              valeur={donneesRendezVous?.totalRendezVous || 0}
              icone={Calendar}
              couleur="blue"
            />
            
            <CarteMetrique
              titre="RDV confirmés"
              valeur={donneesRendezVous?.rendezVousConfirmes || 0}
              icone={Target}
              couleur="green"
            />
            
            <CarteMetrique
              titre="Taux conversion"
              valeur={donneesRendezVous?.tauxConversion || 0}
              icone={TrendingUp}
              couleur="purple"
              formatage="pourcentage"
            />
            
            <CarteMetrique
              titre="Durée moyenne"
              valeur={donneesRendezVous?.dureeRendezVousMoyenne || 0}
              icone={Clock}
              couleur="orange"
              formatage="duree"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Créneaux populaires */}
            <Card>
              <CardHeader>
                <CardTitle>Créneaux Populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={donneesRendezVous?.creneauxPopulaires || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="heure" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Rendez-vous']}
                      labelFormatter={(heure) => `${heure}h00`}
                    />
                    <Bar dataKey="nombre" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Jours populaires */}
            <Card>
              <CardHeader>
                <CardTitle>Jours Populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={donneesRendezVous?.joursPopulaires || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="nombre" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top professionnels */}
          <Card>
            <CardHeader>
              <CardTitle>Professionnels les Plus Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Professionnel</th>
                      <th className="text-left p-3 font-medium text-gray-700">Email</th>
                      <th className="text-right p-3 font-medium text-gray-700">RDV</th>
                      <th className="text-right p-3 font-medium text-gray-700">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(donneesRendezVous?.professionnelsPlusActifs || []).map((pro, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{pro.nom}</td>
                        <td className="p-3 text-gray-600">{pro.email}</td>
                        <td className="p-3 text-right">
                          <Badge variant="outline">{pro.nombreRendezVous}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Badge 
                            variant={pro.tauxConversion >= 80 ? "default" : "secondary"}
                          >
                            {pro.tauxConversion}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}