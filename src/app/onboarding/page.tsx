// src/app/onboarding/page.tsx

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"
import { Navbar } from "@/components/navbar"
import RegisterContainer from "@/components/register/register-container"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onboardingMode, setOnboardingMode] = useState<'registration' | 'completion'>('registration')

  useEffect(() => {
    try {
      console.log('🟦 [Onboarding] Initialisation - Status:', status, 'Session:', !!session)
      
      // Attendre que la session soit chargée
      if (status === "loading") {
        return
      }

      const role = searchParams.get('role')?.toUpperCase()
      const flow = searchParams.get('flow')

      // CAS 1: Utilisateur connecté avec profil incomplet (redirection depuis middleware)
      if (session?.user?.id && !session.user.hasProfile) {
        console.log('🟦 [Onboarding] Mode: Complétion de profil pour utilisateur connecté')
        
        // Vérifier le rôle de l'utilisateur connecté
        if (!session.user.role || !Object.values(UserRole).includes(session.user.role as UserRole)) {
          setError("Rôle utilisateur invalide")
          return
        }

        setOnboardingMode('completion')
        setIsLoading(false)
        return
      }

      // CAS 2: Nouveau utilisateur (flux classique)
      if (!session?.user?.id) {
        console.log('🟦 [Onboarding] Mode: Nouvel utilisateur')
        
        // Vérifications pour nouveau utilisateur
        if (!role) {
          console.log('🟨 [Onboarding] Pas de rôle spécifié, redirection vers inscription')
          router.replace("/inscription")
          return
        }

        // Valider le rôle
        if (!Object.values(UserRole).includes(role as UserRole)) {
          setError("Type de profil invalide")
          return
        }

        // Valider le flow (optionnel pour compatibilité)
        if (flow && flow !== 'email') {
          setError("Type d'inscription non supporté")
          return
        }

        setOnboardingMode('registration')
        setIsLoading(false)
        return
      }

      // CAS 3: Utilisateur connecté avec profil complet (ne devrait pas arriver)
      if (session?.user?.id && session.user.hasProfile) {
        console.log('🟦 [Onboarding] Utilisateur avec profil complet, redirection vers tableau de bord')
        router.replace("/tableau-de-bord")
        return
      }

      setIsLoading(false)
    } catch (error) {
      console.error('🔴 [Onboarding] Erreur lors de l\'initialisation:', error)
      setError("Une erreur est survenue lors de l'initialisation")
    }
  }, [searchParams, router, session, status])

  // Afficher le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Chargement de votre profil...</p>
          </div>
        </main>
      </div>
    )
  }

  // Afficher l'erreur si présente
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container max-w-4xl py-8">
          <div className="rounded-lg bg-red-50 p-4 text-red-700 text-center">
            <h2 className="font-semibold mb-2">Erreur de configuration</h2>
            <p>{error}</p>
            <button 
              onClick={() => router.push('/inscription')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retour à l'inscription
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Déterminer les props pour RegisterContainer selon le mode
  const getRegisterContainerProps = () => {
    if (onboardingMode === 'completion') {
      // Mode complétion : utilisateur connecté
      return {
        initialRole: session!.user.role as UserRole,
        initialStep: 2, // Skip étape création de compte
        mode: 'completion' as const
      }
    } else {
      // Mode nouveau : utilisateur non connecté
      const role = searchParams.get('role')?.toUpperCase() as UserRole
      return {
        initialRole: role,
        initialStep: 1,
        mode: 'registration' as const
      }
    }
  }

  const containerProps = getRegisterContainerProps()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <RegisterContainer 
          {...containerProps}
        />
      </main>
    </div>
  )
}