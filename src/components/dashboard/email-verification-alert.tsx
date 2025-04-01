// src/components/dashboard/email-verification-alert.tsx
"use client"

import { useState, useEffect } from "react"
import { Mail, X, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

interface EmailVerificationAlertProps {
  userEmail: string
  userId: string
}

export function EmailVerificationAlert({ userEmail, userId }: EmailVerificationAlertProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChecked, setIsChecked] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const { data: session, update } = useSession()

  // Vérifier l'état de l'email une seule fois au chargement
  useEffect(() => {
    // Si la vérification a déjà été faite, ne rien faire
    if (isChecked) return
    setIsChecked(true)

    const checkEmailStatus = async () => {
      // Si déjà vérifié dans la session, marquer comme vérifié
      if (session?.user?.emailVerified) {
        setIsVerified(true)
        return
      }

      try {
        // Faire une requête unique pour vérifier l'état de l'email
        const timestamp = Date.now()
        const response = await fetch(`/api/users/${userId}?check=emailVerified&_=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.emailVerified) {
            console.log(`🟢 [EmailAlert] Email vérifié selon l'API`)
            setIsVerified(true)
            // Mettre à jour la session pour le prochain affichage
            await update()
          }
        }
      } catch (error) {
        console.error(`🔴 [EmailAlert] Erreur de vérification:`, error)
      }
    }

    // Vérifier seulement si on a un userId
    if (userId) {
      checkEmailStatus()
    }
  }, [userId, isChecked, session?.user?.emailVerified, update])

  const handleResendEmail = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/verifier-email/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Échec de l'envoi")
      }

      setIsSent(true)
    } catch (error) {
      setError("Impossible d'envoyer l'email. Veuillez réessayer.")
      console.error("🔴 [EmailAlert] Erreur d'envoi:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Ne pas afficher si l'email est vérifié ou si l'alerte a été fermée
  if (isVerified || isDismissed) {
    return null
  }

  return (
    <Alert className="mb-6 bg-lavender-light border-lavender/20">
      <div className="flex items-center gap-4">
        <Mail className="h-5 w-5 text-lavender flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-lavender-dark mb-1">
            Vérifiez votre adresse email
          </h3>
          <AlertDescription className="text-lavender-dark/90">
            {isSent ? (
              <>Email de vérification envoyé à <strong>{userEmail}</strong>. Vérifiez votre boîte de réception.</>
            ) : (
              <>Pour profiter de toutes les fonctionnalités, veuillez vérifier votre adresse email <strong>{userEmail}</strong>.</>
            )}
          </AlertDescription>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isSent && (
            <Button 
              onClick={handleResendEmail}
              disabled={isLoading}
              variant="outline"
              className="border-lavender/20 hover:bg-lavender/5 text-lavender-dark"
              size="sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-gray-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}