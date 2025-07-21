// src/app/(public)/choix-abonnement/page.tsx
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
  },
  {
    name: "Support client",
    standard: "Email (48h)",
    premium: "Prioritaire (24h)",
  },
  {
    name: "Marketing automation",
    standard: false,
    premium: true,
    icon: Zap
  }
]

export default function ChoixAbonnementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    // Cette page est maintenant accessible sans être connecté
    // Elle sert à choisir l'abonnement AVANT la création de compte
  }, [])

  const handlePlanSelection = async (plan: 'standard' | 'premium') => {
    setLoading(plan)

    try {
      toast.success(`Plan ${plan} sélectionné ! Création de votre compte...`)
      
      // Rediriger vers l'onboarding avec le rôle et le plan choisi
      router.push(`/onboarding?role=PROFESSIONAL&flow=email&plan=${plan}`)
    } catch (error) {
      console.error('Erreur lors de la sélection du plan:', error)
      toast.error('Erreur lors de la sélection. Veuillez réessayer.')
    } finally {
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-light/30 to-white">
      <main className="container mx-auto py-8 px-4">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/register')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Étape 2/3 - Choix de l'abonnement</span>
          </div>
        </div>

        {/* Header principal */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary mr-2" />
            <span className="text-primary font-medium">Félicitations !</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-title font-bold text-gray-900 mb-6">
            Choisissez votre plan professionnel
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Sélectionnez le plan qui correspond à vos besoins. 
            Vous créerez ensuite votre compte et configurerez votre profil.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <Shield className="h-4 w-4" />
            <span>Aucun paiement immédiat • Configuration d'abord • Support inclus</span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Plan Standard */}
          <Card className="relative border-2 border-gray-200 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-title mb-2">Standard</CardTitle>
              <p className="text-gray-600 mb-4">Parfait pour débuter</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">20€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Paiement après configuration complète</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                className="w-full h-12" 
                onClick={() => handlePlanSelection('standard')}
                disabled={loading === 'standard'}
              >
                {loading === 'standard' ? (
                  "Sélection..."
                ) : (
                  <>
                    Choisir Standard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Inclus :</h4>
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
                    <span>Gestion des clients</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Notifications email</span>
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
          <Card className="relative border-2 border-primary hover:border-primary/70 transition-colors bg-gradient-to-b from-primary/5 to-white">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-white px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Recommandé
              </Badge>
            </div>
            <CardHeader className="text-center pb-4 pt-8">
              <CardTitle className="text-2xl font-title mb-2">Premium</CardTitle>
              <p className="text-gray-600 mb-4">Pour développer votre activité</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-primary">40€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Paiement après configuration complète</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90" 
                onClick={() => handlePlanSelection('premium')}
                disabled={loading === 'premium'}
              >
                {loading === 'premium' ? (
                  "Sélection..."
                ) : (
                  <>
                    Choisir Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Tout Standard, plus :</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Services illimités</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Site web personnalisé</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Notifications SMS</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Analyses avancées</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Marketing automation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Support prioritaire (24h)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau comparatif simplifié */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900">Comparaison rapide</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium text-gray-900">Fonctionnalité</div>
                <div className="font-medium text-gray-900 text-center">Standard</div>
                <div className="font-medium text-gray-900 text-center">Premium</div>
                
                {features.slice(0, 6).map((feature, index) => (
                  <div key={index} className="contents">
                    <div className="py-2 text-gray-600">{feature.name}</div>
                    <div className="py-2 text-center">{renderFeatureValue(feature.standard)}</div>
                    <div className="py-2 text-center">{renderFeatureValue(feature.premium)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                <span>Choix du plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                <span>Création du compte et profil</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">✓</div>
                <span>C'est parti !</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              <strong>Prochaine étape :</strong> Après avoir choisi votre plan, vous créerez votre compte 
              et configurerez votre profil professionnel. Le paiement se fera seulement à la fin.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}