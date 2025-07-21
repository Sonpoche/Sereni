// src/app/(public)/finaliser-abonnement/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Check, 
  ArrowRight, 
  Star,
  Calendar, 
  Users, 
  Globe, 
  BarChart3, 
  Mail, 
  Smartphone,
  Zap,
  ArrowLeft,
  Shield,
  Clock,
  CreditCard,
  Loader2
} from "lucide-react"

interface PlanDetails {
  standard: {
    name: 'Standard'
    price: 20
    features: string[]
  }
  premium: {
    name: 'Premium'
    price: 40
    features: string[]
  }
}

const planDetails: PlanDetails = {
  standard: {
    name: 'Standard',
    price: 20,
    features: [
      'Réservations illimitées',
      'Jusqu\'à 10 services',
      'Gestion des clients',
      'Notifications email',
      'Support email (48h)'
    ]
  },
  premium: {
    name: 'Premium',
    price: 40,
    features: [
      'Tout du plan Standard',
      'Services illimités',
      'Site web personnalisé',
      'Notifications SMS',
      'Analyses avancées',
      'Marketing automation',
      'Support prioritaire (24h)'
    ]
  }
}

export default function FinalizerAbonnementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null)

  useEffect(() => {
    // Vérifier que l'utilisateur est connecté et professionnel
    if (status === "unauthenticated") {
      router.push('/inscription')
      return
    }

    if (status === "authenticated") {
      // Si c'est un client, rediriger
      if (session?.user?.role === 'CLIENT') {
        router.push('/tableau-de-bord')
        return
      }

      // Si le profil n'est pas complet, rediriger vers complétion
      if (!session?.user?.hasProfile) {
        router.push('/profil/completer')
        return
      }
    }

    // Récupérer le plan choisi depuis localStorage
    const savedPlan = localStorage.getItem('serenibook_selected_plan') as 'standard' | 'premium'
    const isSubscriptionFlow = localStorage.getItem('serenibook_subscription_flow')
    
    if (!savedPlan || !isSubscriptionFlow) {
      router.push('/tableau-de-bord')
      return
    }

    setSelectedPlan(savedPlan)
  }, [session, status, router])

  const handleStartSubscription = async () => {
    if (!selectedPlan || !session?.user?.id) {
      toast.error("Erreur lors de la configuration de l'abonnement")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          returnUrl: `${window.location.origin}/inscription-reussie?success=true`
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
      }

      // Nettoyer localStorage avant redirection
      localStorage.removeItem('serenibook_selected_plan')
      localStorage.removeItem('serenibook_subscription_flow')

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
      toast.error('Erreur lors de la configuration du paiement. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipForNow = () => {
    // Nettoyer localStorage
    localStorage.removeItem('serenibook_selected_plan')
    localStorage.removeItem('serenibook_subscription_flow')
    
    toast.success("Vous pourrez configurer votre abonnement plus tard depuis les paramètres.")
    router.push('/tableau-de-bord?welcome=true')
  }

  if (status === "loading" || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const currentPlan = planDetails[selectedPlan]

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-light/30 to-white">
      <main className="container mx-auto py-8 px-4">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/tableau-de-bord')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Étape finale - Configuration du paiement</span>
          </div>
        </div>

        {/* Header principal */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600 bg-green-100 rounded-full p-1 mr-2" />
            <span className="text-green-600 font-medium">Profil complété !</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-title font-bold text-gray-900 mb-6">
            Finalisez votre abonnement
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Votre profil est maintenant configuré. Activez votre plan <strong>{currentPlan.name}</strong> 
            pour commencer à recevoir des clients.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <Shield className="h-4 w-4" />
            <span>Paiement sécurisé par Stripe • Annulation possible à tout moment</span>
          </div>
        </div>

        {/* Récapitulatif du plan choisi */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="border-2 border-primary bg-gradient-to-b from-primary/5 to-white">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-primary mr-1" />
                <Badge className="bg-primary text-white">Plan sélectionné</Badge>
              </div>
              <CardTitle className="text-3xl font-title mb-2">{currentPlan.name}</CardTitle>
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span className="text-5xl font-bold text-primary">{currentPlan.price}€</span>
                <span className="text-gray-600 text-xl">/mois</span>
              </div>
              <p className="text-gray-600">Facturation mensuelle • Premier mois prorata</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Votre plan inclut :</h4>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="max-w-md mx-auto space-y-4">
          <Button 
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90" 
            onClick={handleStartSubscription}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirection vers le paiement...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Activer mon abonnement {currentPlan.name}
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-12" 
            onClick={handleSkipForNow}
            disabled={loading}
          >
            Configurer plus tard
          </Button>
        </div>

        {/* Info supplémentaires */}
        <div className="max-w-2xl mx-auto mt-12 space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Garanties incluses
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Annulation possible à tout moment sans frais</li>
              <li>• Support technique inclus dans tous les plans</li>
              <li>• Données sécurisées et sauvegardées automatiquement</li>
              <li>• Mise à jour automatique des fonctionnalités</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Informations de paiement
            </h3>
            <p className="text-sm text-blue-800">
              Votre abonnement sera géré de manière sécurisée par Stripe. 
              Vous recevrez une facture mensuelle par email et pourrez gérer 
              votre abonnement depuis votre espace paramètres.
            </p>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              Une question ? Contactez-nous à{" "}
              <a href="mailto:support@serenibook.fr" className="text-primary hover:underline">
                support@serenibook.fr
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}