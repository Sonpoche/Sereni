// src/app/auth/error/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Ban, 
  KeyRound, 
  Mail, 
  AlertCircle 
} from "lucide-react"

const errorMessages: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
  "Configuration": {
    title: "Problème de configuration",
    message: "Il y a un problème avec la configuration de l'authentification. Veuillez réessayer plus tard.",
    icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
  },
  "AccessDenied": {
    title: "Accès refusé",
    message: "Vous n'avez pas les autorisations nécessaires pour accéder à cette page.",
    icon: <Ban className="h-12 w-12 text-red-500" />,
  },
  "Verification": {
    title: "Lien de vérification expiré",
    message: "Le lien de vérification a expiré ou a déjà été utilisé.",
    icon: <Mail className="h-12 w-12 text-orange-500" />,
  },
  "Default": {
    title: "Erreur d'authentification",
    message: "Une erreur est survenue lors de l'authentification. Veuillez réessayer.",
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
  },
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<{
    title: string
    message: string
    icon: React.ReactNode
  }>(errorMessages.Default)

  useEffect(() => {
    const errorType = searchParams.get('error')
    if (errorType && errorType in errorMessages) {
      setError(errorMessages[errorType])
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center space-y-6">
            {/* Icône */}
            <div className="flex justify-center">
              {error.icon}
            </div>

            {/* Titre et message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{error.title}</h1>
              <p className="text-muted-foreground">
                {error.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-4">
              <Link href="/login">
                <Button className="w-full" variant="default">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
              
              <Link href="/">
                <Button className="w-full" variant="outline">
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}