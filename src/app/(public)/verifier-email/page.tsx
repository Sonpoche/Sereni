// src/app/(public)/verifier-email/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  
  // Référence pour éviter les vérifications multiples
  const verificationAttempted = useRef(false)

  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      // Éviter les vérifications multiples
      if (verificationAttempted.current) {
        return
      }
      
      // Marquer comme vérifié immédiatement
      verificationAttempted.current = true
      
      if (!token) {
        setStatus('error')
        setError("Token manquant")
        return
      }

      try {
        console.log("🟦 [VerifyEmailPage] Vérification du token:", token)
        
        const response = await fetch(`/api/auth/verifier-email/confirmer?token=${token}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        const data = await response.json()

        if (!response.ok) {
          console.error("🔴 [VerifyEmailPage] Erreur de l'API:", data)
          
          // Si l'erreur est que le token est déjà utilisé, ce n'est pas un problème
          // si l'email de l'utilisateur est déjà vérifié
          if (data.error && (data.error.includes("déjà utilisé") || data.error.includes("invalide"))) {
            // On est dans un cas où le token a déjà été utilisé
            // Vérifions si l'email de l'utilisateur est déjà marqué comme vérifié
            if (session?.user?.emailVerified) {
              console.log("🟦 [VerifyEmailPage] Email déjà vérifié selon la session")
              setStatus('success')
              return
            }
            
            // Si nous avons un utilisateur connecté, vérifions son statut
            if (session?.user?.id) {
              try {
                // Inclure un ID de requête unique pour éviter le cache
                const requestId = Math.random().toString(36).substring(2, 10);
                const userResponse = await fetch(`/api/users/${session.user.id}?check=emailVerified&requestId=${requestId}`, {
                  cache: 'no-store',
                  headers: {
                    'Pragma': 'no-cache'
                  }
                })
                const userData = await userResponse.json()
                
                if (userData.emailVerified) {
                  console.log("🟦 [VerifyEmailPage] Email déjà vérifié selon l'API")
                  await update() // Mettre à jour la session
                  setStatus('success')
                  return
                }
              } catch (checkError) {
                console.error("🔴 [VerifyEmailPage] Erreur lors de la vérification du statut:", checkError)
              }
            }
          }
          
          throw new Error(data.error || "Échec de la vérification")
        }

        console.log("🟦 [VerifyEmailPage] Vérification réussie:", data)

        // Forcer une synchronisation de la session avec un ID unique
        try {
          const requestId = Math.random().toString(36).substring(2, 10);
          await fetch(`/api/auth/sync-session?userId=${session?.user?.id || ''}&requestId=${requestId}`, {
            method: 'POST',
            headers: { 
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
        } catch (syncError) {
          console.warn("⚠️ [VerifyEmailPage] Erreur de synchronisation:", syncError)
        }

        // Mettre à jour la session côté client
        await update()
        
        setStatus('success')
      } catch (error) {
        console.error("🔴 [VerifyEmailPage] Erreur:", error)
        setStatus('error')
        setError(error instanceof Error ? error.message : "Une erreur est survenue")
      }
    }

    verifyEmail()
  }, [token, update, session?.user?.id, session?.user?.emailVerified])

  if (status === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg">Vérification de votre email en cours...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-full max-w-md mx-auto py-12">
        <div className="text-center mb-6">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-medium text-gray-900 mb-4">
            Problème de vérification
          </h1>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="text-center">
          <p className="mb-6 text-gray-600">
            {error?.toLowerCase().includes("déjà utilisé") ? 
              "Si vous avez déjà vérifié votre email, vous pouvez vous connecter." :
              "Veuillez essayer de nouveau ou demander un nouveau lien de vérification."}
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/tableau-de-bord">
              <Button variant="outline">
                Aller au tableau de bord
              </Button>
            </Link>
            <Link href="/connexion">
              <Button>
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto text-center py-12">
      <div className="mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-medium text-gray-900 mb-4">
          Email vérifié avec succès !
        </h1>
        <p className="text-gray-600 mb-8">
          Votre adresse email a été confirmée. Vous pouvez maintenant profiter de toutes les fonctionnalités de SereniBook.
        </p>
      </div>
      <Link href="/tableau-de-bord">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          Aller au tableau de bord
        </Button>
      </Link>
    </div>
  )
}