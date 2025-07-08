// src/components/appointments/group-class-appointment-details.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Users,
  Clock,
  MapPin,
  Wifi,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface GroupClassAppointmentDetailsProps {
  appointment: {
    id: string
    startTime: string
    endTime: string
    status: string
    notes?: string
    groupClassData: {
      sessionId: string
      groupClassId: string
      name: string
      maxParticipants: number
      currentParticipants: number
      category: string
      isOnline: boolean
      city?: string
      registrations: Array<{
        id: string
        status: string
        registeredAt: string
        client: {
          id: string
          phone?: string
          user: {
            name: string
            email: string
          }
        }
      }>
    }
  }
  onEdit?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

export function GroupClassAppointmentDetails({ 
  appointment, 
  onEdit, 
  onCancel, 
  onDelete 
}: GroupClassAppointmentDetailsProps) {
  const [showParticipants, setShowParticipants] = useState(false)
  const [loading, setLoading] = useState(false)

  const { groupClassData } = appointment
  const startDate = new Date(appointment.startTime)
  const endDate = new Date(appointment.endTime)
  
  const availablePlaces = groupClassData.maxParticipants - groupClassData.currentParticipants
  const isPastSession = startDate < new Date()

  // Fonction pour confirmer/annuler une inscription
  const handleRegistrationStatusChange = async (registrationId: string, newStatus: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/inscriptions/${registrationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut")
      }

      toast.success(`Inscription ${newStatus === "CONFIRMED" ? "confirmée" : "annulée"} avec succès`)
      
      // Recharger la page ou mettre à jour les données
      window.location.reload()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête du cours collectif */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-700">Cours collectif</span>
          </div>
          
          <h3 className="font-semibold text-lg mb-1">{groupClassData.name}</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{groupClassData.category}</Badge>
            {groupClassData.isOnline ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                En ligne
              </Badge>
            ) : (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <MapPin className="h-3 w-3 mr-1" />
                {groupClassData.city}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Informations de la session */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">
              {format(startDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </div>
            <div className="text-gray-500 text-xs">
              {format(startDate, 'HH:mm', { locale: fr })} - {format(endDate, 'HH:mm', { locale: fr })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">
              {groupClassData.currentParticipants}/{groupClassData.maxParticipants} participants
            </div>
            <div className="text-gray-500 text-xs">
              {availablePlaces > 0 ? `${availablePlaces} place${availablePlaces > 1 ? 's' : ''} restante${availablePlaces > 1 ? 's' : ''}` : "Complet"}
            </div>
          </div>
        </div>
      </div>

      {appointment.notes && (
        <div>
          <h4 className="font-medium text-sm mb-1">Notes de la séance</h4>
          <p className="text-sm text-gray-600">{appointment.notes}</p>
        </div>
      )}

      <Separator />

      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Participants inscrits</h4>
          {groupClassData.currentParticipants > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(true)}
            >
              <Users className="h-4 w-4 mr-1" />
              Voir la liste ({groupClassData.currentParticipants})
            </Button>
          )}
        </div>

        {groupClassData.currentParticipants === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Aucune inscription pour l'instant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {groupClassData.registrations.slice(0, 3).map((registration) => (
              <div key={registration.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {registration.client.user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{registration.client.user.name}</p>
                    <p className="text-xs text-gray-500">
                      Inscrit le {format(new Date(registration.registeredAt), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={registration.status === "REGISTERED" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {registration.status === "REGISTERED" ? "Inscrit" : registration.status}
                </Badge>
              </div>
            ))}
            
            {groupClassData.currentParticipants > 3 && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowParticipants(true)}
                >
                  +{groupClassData.currentParticipants - 3} autres participants
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {!isPastSession && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          </>
        )}
        
        {isPastSession && (
          <div className="w-full text-center py-2">
            <span className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              Séance terminée
            </span>
          </div>
        )}
      </div>

      {/* Dialog pour voir tous les participants */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Participants inscrits</DialogTitle>
            <DialogDescription>
              Liste des participants pour "{groupClassData.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {groupClassData.registrations.map((registration) => (
              <Card key={registration.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {registration.client.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{registration.client.user.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {registration.client.user.email}
                          </span>
                          {registration.client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {registration.client.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Inscrit le {format(new Date(registration.registeredAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={registration.status === "REGISTERED" ? "secondary" : "outline"}
                      >
                        {registration.status === "REGISTERED" ? "Inscrit" : registration.status}
                      </Badge>
                      
                      {!isPastSession && registration.status === "REGISTERED" && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegistrationStatusChange(registration.id, "CONFIRMED")}
                            disabled={loading}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegistrationStatusChange(registration.id, "CANCELLED")}
                            disabled={loading}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {groupClassData.currentParticipants === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Aucune inscription pour cette séance</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}