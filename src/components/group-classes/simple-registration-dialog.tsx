// src/components/group-classes/simple-registration-dialog.tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Euro, 
  Users,
  Wifi,
  Mail
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { formatServicePrice } from "@/lib/utils"

interface SimpleRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: any
  groupClass: any
  onSuccess: () => void
}

export default function SimpleRegistrationDialog({
  open,
  onOpenChange,
  session: courseSession,
  groupClass,
  onSuccess
}: SimpleRegistrationDialogProps) {
  const { data: userSession } = useSession()
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async () => {
    if (!userSession?.user?.id) {
      toast.error("Vous devez être connecté pour vous inscrire")
      return
    }

    try {
      setIsRegistering(true)
      
      const response = await fetch(`/api/users/${userSession.user.id}/inscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: courseSession.id,
          groupClassId: groupClass.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'inscription")
      }

      onSuccess()
      
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'inscription")
    } finally {
      setIsRegistering(false)
    }
  }

  const availablePlaces = groupClass.maxParticipants - courseSession.registrations.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inscription au cours</DialogTitle>
          <DialogDescription>
            Confirmez votre inscription à cette séance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Détails du cours */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{groupClass.name}</h3>
              <div className="flex gap-2">
                <Badge variant="secondary">{groupClass.category}</Badge>
                <Badge variant="outline">{groupClass.level}</Badge>
              </div>
            </div>

            <Separator />

            {/* Détails de la séance */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">
                    {format(new Date(courseSession.startTime), 'EEEE d MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">
                    {format(new Date(courseSession.startTime), 'HH:mm', { locale: fr })} - 
                    {format(new Date(courseSession.endTime), 'HH:mm', { locale: fr })}
                  </div>
                  <div className="text-gray-500">{groupClass.duration} minutes</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {groupClass.isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Cours en ligne</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{groupClass.city}</div>
                      {groupClass.address && (
                        <div className="text-gray-500 text-xs">
                          {groupClass.address}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">
                    {availablePlaces} place{availablePlaces > 1 ? 's' : ''} restante{availablePlaces > 1 ? 's' : ''}
                  </div>
                  <div className="text-gray-500 text-xs">
                    sur {groupClass.maxParticipants} places
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Prix */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Prix de la séance</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatServicePrice(groupClass.price)}
              </div>
            </div>

            {/* Informations importantes */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">
                    Confirmation par email
                  </div>
                  <p className="text-blue-700">
                    Le praticien recevra votre demande d'inscription et vous confirmera 
                    votre place par email. Le paiement se fera directement auprès du praticien.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={isRegistering || availablePlaces === 0}
          >
            {isRegistering ? "Inscription en cours..." : "Confirmer l'inscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}