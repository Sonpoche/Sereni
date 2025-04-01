"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { UserRole } from "@prisma/client"
import { Navbar } from "@/components/navbar"
import RegisterContainer from "@/components/register/register-container"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Vérification des paramètres
      const role = searchParams.get('role')?.toUpperCase()
      const flow = searchParams.get('flow')

      // Si pas de rôle, rediriger vers la page d'inscription
      if (!role) {
        router.replace("/register")
        return
      }

      // Valider le rôle
      if (!Object.values(UserRole).includes(role as UserRole)) {
        setError("Type de profil invalide")
        return
      }

      // Valider le flow
      if (flow !== 'email') {
        setError("Type d'inscription non supporté")
        return
      }

      setIsLoading(false)
    } catch (error) {
      setError("Une erreur est survenue lors de l'initialisation")
    }
  }, [searchParams, router])

  // Afficher le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        </main>
      </div>
    )
  }

  // Récupérer le rôle depuis les paramètres
  const role = searchParams.get('role')?.toUpperCase() as UserRole

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <RegisterContainer 
          initialRole={role} 
          initialStep={1}
        />
      </main>
    </div>
  )
}