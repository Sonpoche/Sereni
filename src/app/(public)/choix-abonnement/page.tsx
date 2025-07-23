// src/app/(public)/choix-abonnement/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Sparkles
} from "lucide-react"

const features = [
  {
    name: "Réservations illimitées",
    standard: true,
    premium: true,
    icon: Calendar
  },
  {
    name: "Gestion des clients",
    standard: true,
    premium: true,
    icon: Users
  },
  {
    name: "Services personnalisés",
    standard: "Jusqu'à 10",
    premium: "Illimités",
  },
  {
    name: "Notifications automatiques",
    standard: "Email uniquement",
    premium: "Email + SMS",
    icon: Mail
  },
  {
    name: "Site web personnalisé",
    standard: false,
    premium: true,
    icon: Globe
  },
  {
    name: "Analyses avancées",
    standard: "Basiques",
    premium: "Complètes",
    icon: BarChart3
  }
]

export default function ChoixAbonnementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePlanSelection = async (plan: 'standard' | 'premium') => {
    setLoading(plan)

    try {
      toast.success(`Plan ${plan} sélectionné ! Commençons la création de votre profil...`)
      
      // 🔧 MODIFICATION PRINCIPALE : Rediriger vers l'onboarding avec le plan pré-sélectionné
      setTimeout(() => {
        router.push(`/inscription?role=PROFESSIONAL&plan=${plan}`)
      }, 1000) // Petit délai pour voir le toast
      
    } catch (error) {
      console.error('Erreur lors de la sélection du plan:', error)
      toast.error('Erreur lors de la sélection. Veuillez réessayer.')
      setLoading(null)
    }
  }

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-4 w-4 text-green-600" />
    }
    if (value === false) {
      return <span className="text-xs text-gray-400">Non inclus</span>
    }
    return <span className="text-xs text-gray-600">{value}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto py-8 px-4">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/inscription')}
            className="text-gray-600 hover:text-gray-900"
            disabled={!!loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Étape 1 - Choix de votre plan</span>
          </div>
        </div>

        {/* Header principal */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary mr-2" />
            <span className="text-primary font-medium">Bienvenue chez SereniBook !</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-title font-bold text-gray-900 mb-6">
            Choisissez votre plan professionnel
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Sélectionnez d'abord le plan qui correspond à vos besoins. 
            Ensuite, nous configurerons ensemble votre profil professionnel.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <Shield className="h-4 w-4" />
            <span>Paiement seulement à la fin • Configuration complète d'abord</span>
          </div>
        </div>

        {/* Plans côte à côte */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Plan Standard */}
          <Card className={`relative border-2 transition-all duration-300 ${
            loading === 'standard' 
              ? 'border-blue-500 shadow-lg' 
              : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
          }`}>
            <CardHeader className="text-center pb-4">
              <Badge className="bg-blue-100 text-blue-800 mb-3 mx-auto w-fit">
                Populaire
              </Badge>
              <CardTitle className="text-2xl font-title mb-2">Standard</CardTitle>
              <p className="text-gray-600 mb-4">Parfait pour débuter votre activité</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-blue-600">20€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Facturé après configuration</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700" 
                onClick={() => handlePlanSelection('standard')}
                disabled={!!loading}
              >
                {loading === 'standard' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sélection en cours...
                  </>
                ) : (
                  <>
                    Commencer avec Standard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Inclus dans votre plan :</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Réservations illimitées</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Jusqu'à 10 services</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Gestion complète des clients</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Notifications email automatiques</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Application mobile</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Support email (48h)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Plan Premium */}
          <Card className={`relative border-2 transition-all duration-300 ${
            loading === 'premium' 
              ? 'border-purple-500 shadow-lg' 
              : 'border-purple-300 hover:border-purple-500 hover:shadow-md'
          } bg-gradient-to-b from-purple-50/30 to-white`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Recommandé
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4 pt-8">
              <CardTitle className="text-2xl font-title mb-2 text-purple-900">Premium</CardTitle>
              <p className="text-purple-700 mb-4 font-medium">Pour développer votre activité complètement</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-purple-600">40€</span>
                <span className="text-purple-600">/mois</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-2">
                Économisez 50% vs solutions séparées !
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-semibold" 
                onClick={() => handlePlanSelection('premium')}
                disabled={!!loading}
              >
                {loading === 'premium' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sélection en cours...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-5 w-5" />
                    Commencer avec Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Tout Standard, plus :</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-purple-700">Services illimités</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-purple-700">Site web personnalisé inclus</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Notifications SMS automatiques</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Analyses et statistiques avancées</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Marketing automation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Support prioritaire (24h)</span>
                  </li>
                </ul>
              </div>
              
              {/* Petite section d'encouragement */}
              <div className="text-center text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                🚀 Choisi par 80% de nos professionnels
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section pourquoi choisir maintenant */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Pourquoi choisir votre plan dès maintenant ?
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">Configuration personnalisée</p>
                  <p className="text-gray-600">Nous adaptons votre profil selon vos besoins</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">Transparence totale</p>
                  <p className="text-gray-600">Aucune surprise, vous savez exactement ce que vous payez</p>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium">Motivation maximale</p>
                  <p className="text-gray-600">Finalisez votre inscription plus rapidement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau comparatif compact */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900 text-center">Comparaison rapide</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium text-gray-500 text-xs uppercase tracking-wider">Fonctionnalité</div>
                <div className="font-medium text-blue-600 text-center">Standard</div>
                <div className="font-medium text-purple-600 text-center">Premium</div>
                
                {features.map((feature, index) => (
                  <div key={index} className="contents">
                    <div className="py-2 text-gray-600 text-xs">{feature.name}</div>
                    <div className="py-2 text-center">{renderFeatureValue(feature.standard)}</div>
                    <div className="py-2 text-center">{renderFeatureValue(feature.premium)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec prochaines étapes */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Votre parcours après sélection</h3>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">1</div>
                <span>Plan choisi</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                <span>Création compte</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                <span>Configuration profil</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">✓</div>
                <span>Paiement & activation</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              <strong>Temps estimé :</strong> 10-15 minutes pour une configuration complète
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}