// src/app/(public)/inscription-reussie/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle, 
  ArrowRight, 
  Star,
  Calendar, 
  Users, 
  Globe,
  Sparkles,
  Gift
} from "lucide-react"

export default function InscriptionReussiePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Vérifier si on vient de Stripe
  const fromStripe = searchParams.get('success') === 'true'
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // ✅ NETTOYER toutes les données d'onboarding après succès
    console.log('🟦 [InscriptionReussie] Nettoyage des données après succès')
    
    localStorage.removeItem('serenibook_selected_plan')
    localStorage.removeItem('serenibook_subscription_flow')
    localStorage.removeItem('serenibook_onboarding_data')
    localStorage.removeItem('serenibook_onboarding_step')
    localStorage.removeItem('serenibook_onboarding_role')
    
    console.log('🟦 [InscriptionReussie] Données nettoyées avec succès')

    // Animation de confettis simulée
    const timer = setTimeout(() => {
      console.log('🎉 Inscription réussie!')
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (status === "authenticated" && session?.user?.role === 'PROFESSIONAL') {
        try {
          const response = await fetch('/api/stripe/subscription')
          if (response.ok) {
            const data = await response.json()
            setSubscriptionData(data)
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'abonnement:', error)
        }
      }
      setLoading(false)
    }

    fetchSubscriptionData()
  }, [session, status])

  const handleStartJourney = () => {
    router.push('/tableau-de-bord?welcome=true')
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/connexion')
    return null
  }

  const isClient = session.user.role === 'CLIENT'
  const isProfessional = session.user.role === 'PROFESSIONAL'

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <main className="container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header principal */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <CheckCircle className="h-24 w-24 text-green-600" />
                <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-title font-bold text-gray-900 mb-6">
              Félicitations !
            </h1>
            
            {isClient ? (
              <>
                <p className="text-2xl text-gray-700 mb-4">
                  Votre compte client est créé
                </p>
                <p className="text-xl text-gray-600">
                  Découvrez maintenant tous nos professionnels du bien-être près de chez vous
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl text-gray-700 mb-4">
                  Votre espace professionnel est prêt !
                </p>
                {subscriptionData?.subscription ? (
                  <p className="text-xl text-gray-600">
                    Votre abonnement <strong className="text-primary">
                      {subscriptionData.subscription.plan}
                    </strong> est maintenant actif
                  </p>
                ) : (
                  <p className="text-xl text-gray-600">
                    Votre profil professionnel est configuré et vous pouvez commencer à recevoir des clients
                  </p>
                )}
              </>
            )}
          </div>

          {/* Cards d'information */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {isClient ? (
              <>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-10 w-10 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Réservez facilement</h3>
                    <p className="text-sm text-gray-600">
                      Trouvez et réservez vos séances en quelques clics
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Professionnels vérifiés</h3>
                    <p className="text-sm text-gray-600">
                      Accédez à un réseau de praticiens qualifiés
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-6 text-center">
                    <Star className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Suivi personnalisé</h3>
                    <p className="text-sm text-gray-600">
                      Suivez vos rendez-vous et votre progression
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-10 w-10 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Planning automatisé</h3>
                    <p className="text-sm text-gray-600">
                      Gérez vos disponibilités et réservations
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Gestion clients</h3>
                    <p className="text-sm text-gray-600">
                      Centralisez vos contacts et historiques
                    </p>
                  </CardContent>
                </Card>
                
                {subscriptionData?.subscription?.plan === 'premium' && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-6 text-center">
                      <Globe className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Site web inclus</h3>
                      <p className="text-sm text-gray-600">
                        Votre site professionnel sera créé automatiquement
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Cadeau de bienvenue pour les professionnels */}
          {isProfessional && (
            <Card className="border-primary bg-gradient-to-r from-primary/5 to-primary/10 mb-8">
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Cadeau de bienvenue !
                </h3>
                <p className="text-lg text-gray-700 mb-4">
                  Profitez de votre plateforme complètement configurée pour développer votre activité
                </p>
                <p className="text-sm text-gray-600">
                  Tous les outils dont vous avez besoin sont à votre disposition
                </p>
              </CardContent>
            </Card>
          )}

          {/* Prochaines étapes */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Prochaines étapes recommandées
              </h3>
              
              {isClient ? (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">1</div>
                    <div>
                      <h4 className="font-semibold">Complétez votre profil</h4>
                      <p className="text-sm text-gray-600">Ajoutez vos préférences pour des recommandations personnalisées</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">2</div>
                    <div>
                      <h4 className="font-semibold">Explorez les professionnels</h4>
                      <p className="text-sm text-gray-600">Découvrez les praticiens près de chez vous</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">3</div>
                    <div>
                      <h4 className="font-semibold">Réservez votre première séance</h4>
                      <p className="text-sm text-gray-600">Commencez votre parcours bien-être</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">1</div>
                    <div>
                      <h4 className="font-semibold">Configurez vos services</h4>
                      <p className="text-sm text-gray-600">Définissez vos prestations et tarifs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">2</div>
                    <div>
                      <h4 className="font-semibold">Personnalisez votre planning</h4>
                      <p className="text-sm text-gray-600">Définissez vos créneaux de disponibilité</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">3</div>
                    <div>
                      <h4 className="font-semibold">Partagez votre profil</h4>
                      <p className="text-sm text-gray-600">Invitez vos premiers clients à vous rejoindre</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA Principal */}
          <div className="text-center">
            <Button 
              size="lg"
              className="h-14 px-8 text-lg bg-primary hover:bg-primary/90"
              onClick={handleStartJourney}
            >
              {isClient ? (
                <>
                  Découvrir les professionnels
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  Accéder à mon espace professionnel
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            
            <p className="mt-4 text-sm text-gray-600">
              Vous pouvez aussi explorer notre{" "}
              <a href="/aide" className="text-primary hover:underline">guide de démarrage</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}