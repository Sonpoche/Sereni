// src/components/register/steps/subscription-step.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Check, 
  Star,
  Shield,
  CreditCard,
  Loader2,
  Lock,
  User,
  Building,
  Globe
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SubscriptionStepProps {
  selectedPlan: 'standard' | 'premium' // Plan déjà choisi depuis l'URL
  onSubmit: (data: { plan: 'standard' | 'premium' }) => void
  onSkip: () => void
  onBack: () => void
  isLoading: boolean
  userInfo?: {
    name?: string
    email?: string
  }
}

const planDetails = {
  standard: {
    name: 'Standard',
    price: 20,
    description: 'Parfait pour commencer',
    color: 'blue',
    features: [
      'Réservations illimitées',
      'Jusqu\'à 10 services',
      'Gestion des clients',
      'Notifications email',
      'Application mobile',
      'Support email (48h)'
    ]
  },
  premium: {
    name: 'Premium',
    price: 40,
    description: 'Pour une activité complète',
    color: 'purple',
    features: [
      'Tout du plan Standard',
      'Services illimités',
      'Site web personnalisé',
      'Notifications SMS',
      'Analyses avancées',
      'Marketing automation',
      'Support prioritaire (24h)',
      'Personnalisation avancée'
    ]
  }
}

export default function SubscriptionStep({ 
  selectedPlan,
  onSubmit, 
  onSkip, 
  onBack, 
  isLoading,
  userInfo
}: SubscriptionStepProps) {
  const [paymentStep, setPaymentStep] = useState<'checkout' | 'processing'>('checkout')
  const [countdown, setCountdown] = useState(0)

  const currentPlan = planDetails[selectedPlan]
  const isStandard = selectedPlan === 'standard'

  const handlePayment = () => {
    console.log('🟦 [SubscriptionStep] 🚀 Bouton cliqué !') // Debug
    
    setPaymentStep('processing')
    setCountdown(3)
    
    // Toast de début
    toast.loading('Traitement du paiement...', { id: 'payment' })
    
    // Timer simple qui fonctionne
    const timer = setInterval(() => {
      setCountdown(prev => {
        console.log('🟦 [SubscriptionStep] Countdown:', prev - 1) // Debug
        
        if (prev <= 1) {
          clearInterval(timer)
          console.log('🟦 [SubscriptionStep] ✅ Appel onSubmit') // Debug
          
          // Utiliser setTimeout pour éviter l'erreur React
          setTimeout(() => {
            onSubmit({ plan: selectedPlan })
          }, 100) // Petit délai pour laisser le temps au state de se mettre à jour
          
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  if (paymentStep === 'processing') {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">
            Traitement du paiement
          </h2>
          <p className="text-xl text-gray-600">
            Activation de votre abonnement {currentPlan.name} en cours...
          </p>
          <p className="text-lg text-blue-600 font-medium">
            Finalisation dans {countdown} seconde{countdown > 1 ? 's' : ''}
          </p>
        </div>

        <div className="max-w-md mx-auto bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center mb-3">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Paiement sécurisé</span>
          </div>
          <p className="text-sm text-blue-700">
            🎭 Simulation en cours - Aucun vrai paiement effectué
          </p>
        </div>
      </div>
    )
  }

  // Interface de checkout
  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Finaliser votre abonnement
        </h2>
        <p className="text-xl text-gray-600 mb-6">
          Votre profil professionnel est entièrement configuré ! 
          Activez maintenant votre plan <strong>{currentPlan.name}</strong> pour commencer à recevoir des clients.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
          <Shield className="h-4 w-4" />
          <span>Paiement sécurisé • Annulation possible à tout moment • 30 jours d'essai</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Colonne gauche - Récapitulatif */}
        <div className="space-y-6">
          {/* Informations client */}
          {userInfo && (userInfo.name || userInfo.email) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userInfo.name && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{userInfo.name}</span>
                  </div>
                )}
                {userInfo.email && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">@</span>
                    <span className="text-gray-700">{userInfo.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Récapitulatif plan avec design adapté */}
          <Card className={cn(
            "border-2 relative",
            isStandard 
              ? "border-blue-200 bg-gradient-to-b from-blue-50/30 to-white" 
              : "border-purple-200 bg-gradient-to-b from-purple-50/30 to-white"
          )}>
            {!isStandard && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
            )}
            
            <CardHeader className={isStandard ? "pb-4" : "pb-4 pt-8"}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Plan sélectionné
                </CardTitle>
                {isStandard && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Standard
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={cn(
                    "text-xl font-bold",
                    isStandard ? "text-blue-900" : "text-purple-900"
                  )}>
                    {currentPlan.name}
                  </h3>
                  <p className={cn(
                    "text-sm font-medium",
                    isStandard ? "text-blue-700" : "text-purple-700"
                  )}>
                    {currentPlan.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-3xl font-bold",
                    isStandard ? "text-blue-600" : "text-purple-600"
                  )}>
                    {currentPlan.price}€
                  </div>
                  <div className="text-sm text-gray-600">/mois</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-900">Inclus dans votre abonnement :</h4>
                <div className="grid grid-cols-1 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className={cn(
                        "text-sm",
                        feature.startsWith('Tout du plan') && !isStandard
                          ? "font-medium text-purple-700" 
                          : "text-gray-700"
                      )}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between font-bold text-lg mb-2">
                  <span>Total aujourd'hui</span>
                  <span className={cn(
                    isStandard ? "text-blue-600" : "text-purple-600"
                  )}>
                    {currentPlan.price}€
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Puis {currentPlan.price}€/mois, facturé mensuellement</p>
                  <p>• Annulation possible à tout moment</p>
                  <p>• Premier mois prorata si démarrage en cours de mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garanties */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center text-green-800 mb-3">
                <Shield className="h-5 w-5 mr-2" />
                <span className="font-semibold">Vos garanties</span>
              </div>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>30 jours satisfait ou remboursé</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Annulation possible à tout moment</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Support technique inclus</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Données sécurisées et sauvegardées</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite - Formulaire de paiement */}
        <div>
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center justify-center mb-2">
                <Lock className="h-5 w-5 mr-2" />
                <span className="font-medium">Paiement sécurisé par Stripe</span>
              </div>
              <CardTitle className="text-center text-xl">
                Informations de paiement
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Adresse email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={userInfo?.email || 'professionnel@example.com'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>

              {/* Informations de carte simulées */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informations de carte
                </label>
                <div className="space-y-0">
                  <input
                    type="text"
                    value="4242 4242 4242 4242"
                    readOnly
                    placeholder="Numéro de carte"
                    className="w-full px-3 py-2 border border-gray-300 rounded-t-md bg-gray-50 text-gray-700"
                  />
                  <div className="grid grid-cols-2">
                    <input
                      type="text"
                      value="12/26"
                      readOnly
                      placeholder="MM/AA"
                      className="px-3 py-2 border-l border-r border-b border-gray-300 bg-gray-50 text-gray-700"
                    />
                    <input
                      type="text"
                      value="123"
                      readOnly
                      placeholder="CVC"
                      className="px-3 py-2 border-b border-r border-gray-300 rounded-br-md bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🎭 Carte de test Stripe - Simulation de paiement
                </p>
              </div>

              {/* Nom du titulaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du titulaire de la carte
                </label>
                <input
                  type="text"
                  value={userInfo?.name || 'Jean Dupont'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays ou région
                </label>
                <select 
                  value="FR" 
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                >
                  <option value="FR">France</option>
                </select>
              </div>

              {/* Bouton de paiement principal */}
              <Button 
                onClick={handlePayment}
                disabled={isLoading}
                className={cn(
                  "w-full h-14 text-lg font-semibold",
                  isStandard 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Configuration...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payer {currentPlan.price}€ et activer
                  </>
                )}
              </Button>

              {/* Informations complémentaires */}
              <div className="text-center text-xs text-gray-500 space-y-2">
                <p>
                  En cliquant sur "Payer", vous acceptez nos{" "}
                  <a href="#" className="text-blue-600 hover:underline">conditions d'utilisation</a>
                </p>
                <p>🔒 Paiement sécurisé par Stripe • 🎭 Mode simulation activé</p>
                <p>Votre abonnement sera activé immédiatement après paiement</p>
              </div>
            </CardContent>
          </Card>

          {/* Option skip moins visible */}
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={onSkip}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Configurer le paiement plus tard
            </Button>
            <p className="text-xs text-gray-400 mt-1">
              (Votre profil sera créé mais vous ne pourrez pas recevoir de clients)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}