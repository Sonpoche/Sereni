// src/app/(dashboard)/parametres/abonnement/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Progress } from "@/components/ui/progress" // Composant à créer
import { 
  Crown, 
  Calendar, 
  Users, 
  CreditCard, 
  Check, 
  X, 
  AlertTriangle,
  Zap,
  Globe,
  BarChart3,
  Download,
  RefreshCw,
  ExternalLink
} from "lucide-react"

interface SubscriptionData {
  id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  plan: 'standard' | 'premium'
  price: number
  currency: string
  interval: 'month' | 'year'
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  usage: {
    appointments: number
    clients: number
    services: number
    storage: number
  }
  limits: {
    appointments: number | null
    clients: number | null
    services: number
    storage: number
  }
}

// Données mockées - en réalité, récupérées via API Stripe
const mockSubscription: SubscriptionData = {
  id: "sub_1234567890",
  status: 'trialing',
  plan: 'standard',
  price: 20,
  currency: 'eur',
  interval: 'month',
  currentPeriodStart: '2024-07-01',
  currentPeriodEnd: '2024-07-31',
  trialEnd: '2024-07-29',
  cancelAtPeriodEnd: false,
  usage: {
    appointments: 15,
    clients: 8,
    services: 3,
    storage: 256
  },
  limits: {
    appointments: null,
    clients: null,
    services: 10,
    storage: 1024
  }
}

const planFeatures = {
  standard: [
    "Réservations illimitées",
    "Gestion des clients",
    "Jusqu'à 10 services",
    "Cours collectifs",
    "Notifications email",
    "Application mobile",
    "Support email (48h)"
  ],
  premium: [
    "Tout du plan Standard",
    "Services illimités",
    "Site web personnalisé",
    "Notifications SMS",
    "Analyses avancées",
    "Marketing automation",
    "Support prioritaire (24h)",
    "Personnalisation avancée"
  ]
}

const getStatusConfig = (status: SubscriptionData['status']) => {
  switch (status) {
    case 'active':
      return {
        label: 'Actif',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Check
      }
    case 'trialing':
      return {
        label: 'Période d\'essai',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Zap
      }
    case 'past_due':
      return {
        label: 'Paiement en retard',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle
      }
    case 'canceled':
      return {
        label: 'Annulé',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: X
      }
    case 'incomplete':
      return {
        label: 'Incomplet',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertTriangle
      }
  }
}

export default function AbonnementPage() {
  const [subscription] = useState<SubscriptionData>(mockSubscription)
  const [isLoading, setIsLoading] = useState(false)
  
  const statusConfig = getStatusConfig(subscription.status)
  const StatusIcon = statusConfig.icon
  
  const isTrialing = subscription.status === 'trialing'
  const trialDaysLeft = isTrialing && subscription.trialEnd 
    ? Math.ceil((new Date(subscription.trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const usagePercentage = {
    services: subscription.limits.services ? (subscription.usage.services / subscription.limits.services) * 100 : 0,
    storage: (subscription.usage.storage / subscription.limits.storage) * 100
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    // Logique d'upgrade vers Premium via Stripe
    try {
      // Redirection vers Stripe Checkout
      window.location.href = '/api/stripe/upgrade'
    } catch (error) {
      console.error('Erreur lors de l\'upgrade:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDowngrade = async () => {
    setIsLoading(true)
    // Logique de downgrade vers Standard
    try {
      const response = await fetch('/api/stripe/downgrade', {
        method: 'POST'
      })
      if (response.ok) {
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur lors du downgrade:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST'
      })
      if (response.ok) {
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = () => {
    // Redirection vers le portail client Stripe
    window.open('/api/stripe/customer-portal', '_blank')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Gestion de l'abonnement
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez votre plan, facturation et utilisation
        </p>
      </div>

      {/* Statut de l'abonnement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-primary" />
              Plan {subscription.plan === 'premium' ? 'Premium' : 'Standard'}
            </CardTitle>
            <Badge className={`${statusConfig.color} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Détails de l'abonnement</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix:</span>
                  <span className="font-medium">{subscription.price}€/{subscription.interval === 'month' ? 'mois' : 'an'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Période actuelle:</span>
                  <span className="font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')} - {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {isTrialing && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fin d'essai:</span>
                    <span className="font-medium text-blue-600">
                      {trialDaysLeft} jours restants
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Renouvellement automatique:</span>
                  <span className="font-medium">
                    {subscription.cancelAtPeriodEnd ? 'Désactivé' : 'Activé'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Actions rapides</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleManageBilling}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer la facturation
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger les factures
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser les données
                </Button>
              </div>
            </div>
          </div>

          {/* Alerte période d'essai */}
          {isTrialing && (
            <Alert className="bg-blue-50 border-blue-200">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Votre période d'essai gratuite se termine dans <strong>{trialDaysLeft} jours</strong>. 
                Ajoutez un moyen de paiement pour continuer à utiliser SereniBook.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Utilisation et limites */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisation actuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rendez-vous */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Rendez-vous ce mois</span>
                <span className="text-sm text-gray-600">
                  {subscription.usage.appointments} / {subscription.limits.appointments || '∞'}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {subscription.usage.appointments}
              </div>
              <p className="text-xs text-gray-600">Illimités sur tous les plans</p>
            </div>

            {/* Clients */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Clients actifs</span>
                <span className="text-sm text-gray-600">
                  {subscription.usage.clients} / {subscription.limits.clients || '∞'}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {subscription.usage.clients}
              </div>
              <p className="text-xs text-gray-600">Illimités sur tous les plans</p>
            </div>

            {/* Services */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Services créés</span>
                <span className="text-sm text-gray-600">
                  {subscription.usage.services} / {subscription.limits.services}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${usagePercentage.services}%` }}
                ></div>
              </div>
              <div className="text-2xl font-bold text-primary">
                {subscription.usage.services}
              </div>
              <p className="text-xs text-gray-600">
                {subscription.plan === 'standard' ? 'Limité à 10 sur Standard' : 'Illimités sur Premium'}
              </p>
            </div>

            {/* Stockage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Stockage utilisé</span>
                <span className="text-sm text-gray-600">
                  {subscription.usage.storage} MB / {subscription.limits.storage} MB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${usagePercentage.storage}%` }}
                ></div>
              </div>
              <div className="text-2xl font-bold text-primary">
                {Math.round((subscription.usage.storage / subscription.limits.storage) * 100)}%
              </div>
              <p className="text-xs text-gray-600">
                {subscription.limits.storage} MB inclus
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison des plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan Standard */}
        <Card className={subscription.plan === 'standard' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plan Standard</span>
              {subscription.plan === 'standard' && (
                <Badge className="bg-primary text-primary-foreground">Actuel</Badge>
              )}
            </CardTitle>
            <div className="text-3xl font-bold">20€<span className="text-lg font-normal">/mois</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {planFeatures.standard.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {subscription.plan === 'premium' && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDowngrade}
                disabled={isLoading}
              >
                Passer au Standard
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Plan Premium */}
        <Card className={subscription.plan === 'premium' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                Plan Premium
              </span>
              {subscription.plan === 'premium' && (
                <Badge className="bg-primary text-primary-foreground">Actuel</Badge>
              )}
            </CardTitle>
            <div className="text-3xl font-bold">40€<span className="text-lg font-normal">/mois</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {planFeatures.premium.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {subscription.plan === 'standard' && (
              <Button 
                className="w-full"
                onClick={handleUpgrade}
                disabled={isLoading}
              >
                <Crown className="h-4 w-4 mr-2" />
                Passer au Premium
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions d'abonnement */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Annuler l'abonnement</h3>
              <p className="text-sm text-gray-600">
                Votre abonnement restera actif jusqu'à la fin de la période de facturation
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isLoading || subscription.status === 'canceled'}
            >
              {subscription.cancelAtPeriodEnd ? 'Annulation programmée' : 'Annuler l\'abonnement'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}