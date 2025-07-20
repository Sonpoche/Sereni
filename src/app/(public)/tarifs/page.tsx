// src/app/(public)/tarifs/page.tsx
import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Check, 
  X, 
  Star, 
  Users, 
  Calendar, 
  CreditCard, 
  Globe, 
  BarChart3, 
  Mail, 
  Smartphone,
  Palette,
  Zap
} from "lucide-react"

export const metadata: Metadata = {
  title: "Tarifs - Développez votre activité bien-être | SereniBook",
  description: "Découvrez nos plans Standard et Premium pour développer votre activité de professionnel du bien-être. Essai gratuit de 14 jours.",
}

interface PlanFeature {
  name: string
  standard: boolean | string
  premium: boolean | string
  icon?: React.ComponentType<{ className?: string }>
}

const features: PlanFeature[] = [
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
    name: "Cours collectifs",
    standard: true,
    premium: true,
  },
  {
    name: "Notifications automatiques",
    standard: "Email",
    premium: "Email + SMS",
    icon: Mail
  },
  {
    name: "Application mobile",
    standard: true,
    premium: true,
    icon: Smartphone
  },
  {
    name: "Support client",
    standard: "Email (48h)",
    premium: "Prioritaire (24h)",
  },
  {
    name: "Site web personnalisé",
    standard: false,
    premium: true,
    icon: Globe
  },
  {
    name: "Analyses et statistiques",
    standard: "Basiques",
    premium: "Avancées",
    icon: BarChart3
  },
  {
    name: "Personnalisation avancée",
    standard: false,
    premium: true,
    icon: Palette
  },
  {
    name: "Marketing automation",
    standard: false,
    premium: true,
    icon: Zap
  },
  {
    name: "Intégrations externes",
    standard: false,
    premium: true,
  }
]

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-light/30 to-white">
      <div className="container mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-title font-bold text-gray-900 mb-6">
            Choisissez le plan qui vous correspond
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Développez votre activité bien-être avec nos outils professionnels. 
            Tous les plans incluent un essai gratuit de 14 jours.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Check className="h-4 w-4 text-green-500" />
            <span>Sans engagement</span>
            <span className="mx-2">•</span>
            <Check className="h-4 w-4 text-green-500" />
            <span>Annulation à tout moment</span>
            <span className="mx-2">•</span>
            <Check className="h-4 w-4 text-green-500" />
            <span>Support en français</span>
          </div>
        </div>

        {/* Plans de tarification */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Plan Standard */}
          <Card className="relative border-2 border-gray-200 hover:border-primary/50 transition-all">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Standard</CardTitle>
              <p className="text-gray-600 mt-2">
                Parfait pour débuter votre activité
              </p>
              <div className="mt-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">20€</span>
                  <span className="text-gray-500 ml-2">/mois</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Puis 20€/mois après l'essai gratuit
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/inscription">
                <Button className="w-full h-12 mb-6" size="lg">
                  Commencer l'essai gratuit
                </Button>
              </Link>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Inclus dans ce plan :</h4>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.standard === false ? (
                        <X className="h-5 w-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={feature.standard === false ? "text-gray-400" : "text-gray-700"}>
                          {feature.name}
                        </span>
                        {typeof feature.standard === "string" && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({feature.standard})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Plan Premium */}
          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-white px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Le plus populaire
              </Badge>
            </div>
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Premium</CardTitle>
              <p className="text-gray-600 mt-2">
                Pour les professionnels ambitieux
              </p>
              <div className="mt-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">40€</span>
                  <span className="text-gray-500 ml-2">/mois</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Puis 40€/mois après l'essai gratuit
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/inscription">
                <Button className="w-full h-12 mb-6" size="lg">
                  Commencer l'essai gratuit
                </Button>
              </Link>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Tout du Standard, plus :</h4>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-gray-700">{feature.name}</span>
                        {typeof feature.premium === "string" && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({feature.premium})
                          </span>
                        )}
                        {/* Mise en évidence des fonctionnalités Premium exclusives */}
                        {feature.standard === false && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Comment fonctionne l'essai gratuit ?</h3>
                <p className="text-gray-600">
                  Profitez de toutes les fonctionnalités de votre plan choisi pendant 14 jours, 
                  sans aucun engagement. Aucune carte bancaire n'est requise pour commencer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
                <p className="text-gray-600">
                  Oui, vous pouvez passer du plan Standard au Premium ou vice versa à tout moment 
                  depuis votre espace personnel. Les changements prennent effet immédiatement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Les tarifs incluent-ils la TVA ?</h3>
                <p className="text-gray-600">
                  Les tarifs affichés sont HT. La TVA applicable (20% en France) sera ajoutée 
                  lors de la facturation selon votre localisation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Que se passe-t-il si j'annule mon abonnement ?</h3>
                <p className="text-gray-600">
                  Vous pouvez annuler à tout moment. Votre accès reste actif jusqu'à la fin 
                  de votre période de facturation, puis votre compte passe en mode lecture seule.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Proposez-vous des réductions pour les étudiants ?</h3>
                <p className="text-gray-600">
                  Oui ! Nous offrons 50% de réduction sur tous nos plans pour les étudiants 
                  en formation bien-être. Contactez-nous avec votre justificatif étudiant.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-16 bg-primary/5 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Prêt à développer votre activité ?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines de professionnels qui font confiance à SereniBook 
            pour gérer leur activité bien-être.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription">
              <Button size="lg" className="h-12 px-8">
                Commencer l'essai gratuit
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-12 px-8">
                Nous contacter
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Aucune carte bancaire requise • Support en français • Annulation à tout moment
          </p>
        </div>
      </div>
    </div>
  )
}