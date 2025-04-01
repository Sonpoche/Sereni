// src/app/(dashboard)/tableau-de-bord/page.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { UserRole } from "@prisma/client"
import { 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Users, 
  Clock,
  Activity 
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { EmailVerificationAlert } from "@/components/dashboard/email-verification-alert"
import { toast } from "sonner"

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Référence pour éviter les appels multiples
  const initialized = useRef(false)

  // Gestion du retour depuis l'onboarding
  useEffect(() => {
    if (searchParams.get('fromOnboarding') === 'true') {
      toast.success("Votre profil a été complété avec succès !")
      router.replace('/tableau-de-bord', { scroll: false })
    }
  }, [searchParams, router])

  // Redirection si non authentifié
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/connexion")
    }
  }, [status, router])

  // Chargement initial des données, une seule fois
  useEffect(() => {
    // Fonction pour charger les données utilisateur
    const loadUserData = async () => {
      // Ne rien faire si déjà initialisé ou si la session n'est pas prête
      if (initialized.current || status !== "authenticated" || !session?.user?.id) {
        if (status !== "loading") {
          setIsLoading(false)
        }
        return
      }
      
      // Marquer comme initialisé immédiatement pour prévenir toute exécution ultérieure
      initialized.current = true
      
      try {
        const response = await fetch(`/api/users/${session.user.id}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données utilisateur')
        }
        
        const data = await response.json()
        console.log('🟦 [Dashboard] Données utilisateur chargées:', data)
        setUserData(data)
        
        // Redirection conditionnelle
        if (data.isFirstVisit && !data.hasProfile) {
          await fetch(`/api/users/${session.user.id}/first-visit`, {
            method: 'POST'
          })
          router.push('/profil/completer')
        }
      } catch (error) {
        console.error('🔴 [Dashboard] Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, []) // Tableau de dépendances vide pour n'exécuter qu'une seule fois

  // Affichage du loader pendant le chargement
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si pas de session, ne rien afficher
  if (!session) return null

  // Extraire les informations du profil
  const isProfileComplete = userData?.hasProfile || false
  const isFirstVisit = userData?.isFirstVisit || false

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Alerte de vérification d'email */}
          {session.user.email && !session.user.emailVerified && (
            <EmailVerificationAlert 
              userEmail={session.user.email}
              userId={session.user.id}
            />
          )}

          {/* Alerte de profil incomplet */}
          <AnimatePresence mode="wait">
            {!isProfileComplete && !isFirstVisit && (
              <motion.div
                key="profile-alert"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="mb-6 bg-white border-primary/20 shadow-sm">
                  <div className="flex items-center gap-4">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-primary mb-1">
                        {session.user.role === UserRole.PROFESSIONAL 
                          ? "Complétez votre profil professionnel"
                          : "Complétez votre profil"}
                      </h3>
                      <AlertDescription>
                        {session.user.role === UserRole.PROFESSIONAL
                          ? "Pour commencer à recevoir des réservations, ajoutez vos informations professionnelles et configurez vos disponibilités."
                          : "Pour commencer à prendre des rendez-vous, complétez vos informations personnelles."}
                      </AlertDescription>
                    </div>
                    <Button 
                      onClick={() => router.push("/profil/completer")}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      Compléter mon profil
                    </Button>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* En-tête */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="text-2xl font-title font-medium text-gray-900">
              Bienvenue, {session.user.name || 'sur votre tableau de bord'}
            </h1>
            <p className="text-gray-500 mt-2">
              {session.user.role === UserRole.PROFESSIONAL
                ? "Gérez vos rendez-vous et votre activité en toute sérénité"
                : "Retrouvez tous vos rendez-vous et réservations"}
            </p>
          </motion.div>

          {/* Widgets Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}>
              <StatWidget 
                title="Rendez-vous"
                value="0"
                label="aujourd'hui"
                icon={<Calendar className="h-5 w-5 text-primary" />}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatWidget 
                title={session.user.role === UserRole.PROFESSIONAL ? "Clients" : "Réservations"}
                value="0"
                label="ce mois"
                icon={<Users className="h-5 w-5 text-primary" />}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatWidget 
                title="Heures"
                value="0"
                label="de séances"
                icon={<Clock className="h-5 w-5 text-primary" />}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatWidget 
                title="Activité"
                value="0%"
                label="de progression"
                icon={<Activity className="h-5 w-5 text-primary" />}
              />
            </motion.div>
          </div>

          {/* Contenu Principal */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">
              {session.user.role === UserRole.PROFESSIONAL 
                ? "Vos prochains rendez-vous"
                : "Vos réservations"}
            </h2>
            <div className="text-gray-500 text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>
                {session.user.role === UserRole.PROFESSIONAL
                  ? "Vous n'avez pas encore de rendez-vous"
                  : "Vous n'avez pas encore de réservation"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

interface StatWidgetProps {
  title: string;
  value: string;
  label: string;
  icon: React.ReactNode;
}

function StatWidget({ title, value, label, icon }: StatWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-600">{title}</h3>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}