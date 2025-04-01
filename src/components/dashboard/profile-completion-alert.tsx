"use client"

import { UserRole } from "@prisma/client"
import { AlertCircle } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ProfileCompletionAlertProps {
  userRole: UserRole
}

export function ProfileCompletionAlert({ userRole }: ProfileCompletionAlertProps) {
  const router = useRouter()

  const message = userRole === UserRole.PROFESSIONAL
    ? "Pour commencer à recevoir des réservations, complétez votre profil professionnel."
    : "Pour commencer à prendre des rendez-vous, complétez votre profil."

  return (
    <Alert className="mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-4">
        <AlertCircle className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="font-medium text-primary mb-1">
            Profil incomplet
          </h3>
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>
        <Button 
          onClick={() => router.push("/profil/completer")}
          size="sm"
        >
          Compléter mon profil
        </Button>
      </div>
    </Alert>
  )
}