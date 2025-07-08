// src/components/appointments/appointment-details.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  User, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  Tag, 
  FileText, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash,
  Users,
  MapPin,
  Wifi,
  UserCheck,
  UserX,
  AlertCircle,
  Eye
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface AppointmentDetailsProps {
  appointment: any // Type détaillé à définir selon votre modèle
  onEdit: () => void
  onCancel: () => Promise<void>
  onComplete: () => Promise<void>
  onDelete: () => Promise<void>
}

export default function AppointmentDetails({
  appointment,
  onEdit,
  onCancel,
  onComplete,
  onDelete,
}: AppointmentDetailsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Formatage des dates et statuts
  const formattedDate = formatDate(new Date(appointment.startTime))
  const startTime = new Date(appointment.startTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  const endTime = new Date(appointment.endTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  // Détection du type de rendez-vous
  const isNewGroupClass = appointment.isGroupClass === true && appointment.groupClassData;
  const isOldGroupClass = appointment.isGroupClass === true && !appointment.groupClassData;
  const isBlockedTime = appointment.status === "CANCELLED" && 
                       appointment.client?.user?.email === "system@serenibook.app";

  // Fonction pour gérer le statut des inscriptions (pour les cours collectifs)
  const handleRegistrationStatusChange = async (registrationId: string, newStatus: string) => {
    try {
      setIsLoading(true)
      
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
      setIsLoading(false)
    }
  }

  // Fonctions pour les rendez-vous individuels et plages bloquées
  const getStatusBadge = (status: string) => {
    if (isBlockedTime) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Absence</Badge>
    }
    
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En attente</Badge>
      case "CONFIRMED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Confirmé</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Annulé</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Terminé</Badge>
      case "NO_SHOW":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Absence</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const handleCancelAppointment = async () => {
    setIsLoading(true)
    try {
      await onCancel()
      toast.success("Rendez-vous annulé avec succès")
    } catch (error) {
      console.error("Erreur lors de l'annulation du rendez-vous:", error)
      toast.error("Erreur lors de l'annulation du rendez-vous")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCompleteAppointment = async () => {
    setIsLoading(true)
    try {
      await onComplete()
      toast.success("Rendez-vous marqué comme terminé")
    } catch (error) {
      console.error("Erreur lors de la validation du rendez-vous:", error)
      toast.error("Erreur lors de la validation du rendez-vous")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteAppointment = async () => {
    setIsLoading(true)
    try {
      await onDelete()
      setIsDeleteDialogOpen(false)
      toast.success(isBlockedTime ? "Plage bloquée supprimée avec succès" : "Rendez-vous supprimé avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error(isBlockedTime ? "Erreur lors de la suppression de la plage" : "Erreur lors de la suppression du rendez-vous")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Pour simplifier les conditions dans le JSX
  const isPending = appointment.status === "PENDING"
  const isConfirmed = appointment.status === "CONFIRMED"
  const isCancelled = appointment.status === "CANCELLED"
  const isCompleted = appointment.status === "COMPLETED"

  // Si c'est un cours collectif du nouveau système
  if (isNewGroupClass) {
    const { groupClassData } = appointment;
    const startDate = new Date(appointment.startTime);
    const isPastSession = startDate < new Date();
    const availablePlaces = groupClassData.maxParticipants - groupClassData.currentParticipants;

    return (
      <>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-700">Cours collectif</span>
                </div>
                <CardTitle className="mb-2">{groupClassData.name}</CardTitle>
                <div className="flex items-center gap-2 mb-2">
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
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Informations de la session */}
            <div className="border-t border-b py-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{startTime} - {endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {groupClassData.currentParticipants}/{groupClassData.maxParticipants} participants
                </span>
                <span className="text-gray-500">
                  ({availablePlaces > 0 ? `${availablePlaces} place${availablePlaces > 1 ? 's' : ''} restante${availablePlaces > 1 ? 's' : ''}` : "Complet"})
                </span>
              </div>
            </div>
            
            {/* Notes de la séance */}
            {appointment.notes && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Notes de la séance
                </h4>
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
                    <Eye className="h-4 w-4 mr-1" />
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
                  {groupClassData.registrations.slice(0, 3).map((registration: any) => (
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
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
            {!isPastSession && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Trash className="h-4 w-4 mr-1" />
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
          </CardFooter>
        </Card>
        
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
              {groupClassData.registrations.map((registration: any) => (
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
                              disabled={isLoading}
                              title="Confirmer l'inscription"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegistrationStatusChange(registration.id, "CANCELLED")}
                              disabled={isLoading}
                              title="Annuler l'inscription"
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
        
        {/* Dialogue de confirmation pour la suppression/annulation */}
        <AlertDialog 
          open={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La séance du cours collectif sera définitivement annulée.
                {groupClassData.currentParticipants > 0 && (
                  <strong className="block mt-2 text-red-600">
                    Attention : {groupClassData.currentParticipants} participant(s) sont inscrits à cette séance.
                  </strong>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={e => {
                  e.preventDefault()
                  setIsLoading(true)
                  onDelete()
                    .then(() => {
                      setIsDeleteDialogOpen(false)
                      toast.success("Séance de cours collectif annulée avec succès")
                    })
                    .catch(err => {
                      console.error("Erreur lors de l'annulation:", err)
                      toast.error("Erreur lors de l'annulation de la séance")
                    })
                    .finally(() => setIsLoading(false))
                }}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Annulation..." : "Annuler la séance"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
  // Pour les anciens cours collectifs (système Booking avec isGroupClass)
  if (isOldGroupClass) {
    return (
      <>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle>{appointment.service.name}</CardTitle>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                Cours collectif
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informations du cours */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {appointment.currentParticipants}/{appointment.maxParticipants} participants
                </span>
              </div>
            </div>
            
            {/* Informations date/heure */}
            <div className="border-t border-b py-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{startTime} - {endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-500" />
                <span>{appointment.service.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            </div>
            
            {/* Notes */}
            {appointment.notes && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Notes
                </h4>
                <p className="text-sm text-gray-600">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/cours-collectifs?id=${appointment.id}`)}
            >
              <Users className="h-4 w-4 mr-1" />
              Gérer les participants
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              <Trash className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </CardFooter>
        </Card>
        
        {/* Dialogue de confirmation pour la suppression */}
        <AlertDialog 
          open={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le cours collectif sera définitivement supprimé de votre agenda.
                {appointment.groupParticipants && appointment.groupParticipants.length > 0 && (
                  <strong className="block mt-2 text-red-600">
                    Attention : {appointment.groupParticipants.length} participant(s) sont inscrits à ce cours.
                  </strong>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={e => {
                  e.preventDefault()
                  setIsLoading(true)
                  onDelete()
                    .then(() => {
                      setIsDeleteDialogOpen(false)
                      toast.success("Cours collectif supprimé avec succès")
                    })
                    .catch(err => {
                      console.error("Erreur lors de la suppression:", err)
                      toast.error("Erreur lors de la suppression du cours")
                    })
                    .finally(() => setIsLoading(false))
                }}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Rendu pour les rendez-vous individuels et plages bloquées
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle>{isBlockedTime ? "Blocage de plage" : appointment.service.name}</CardTitle>
            {getStatusBadge(appointment.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations du rendez-vous ou de l'absence */}
          {isBlockedTime ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">Système</span>
              </div>
              {appointment.notes && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>{appointment.notes}</span>
                </div>
              )}
            </div>
          ) : (
            // Informations client pour les rendez-vous normaux
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{appointment.client.user.name}</span>
              </div>
              {appointment.client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{appointment.client.phone}</span>
                </div>
              )}
              {appointment.client.user.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{appointment.client.user.email}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Informations rendez-vous */}
          <div className="border-t border-b py-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{startTime} - {endTime}</span>
            </div>
            {!isBlockedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-500" />
                <span>{appointment.service.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            )}
          </div>
          
          {/* Notes */}
          {appointment.notes && !isBlockedTime && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Notes
              </h4>
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2 pt-2">
          {/* Actions pour les plages bloquées */}
          {isBlockedTime && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
              className="w-full"
            >
              <Trash className="h-4 w-4 mr-1" />
              Supprimer la plage bloquée
            </Button>
          )}
          
          {/* Actions pour les rendez-vous normaux */}
          {!isBlockedTime && (
            <>
              {(isPending || isConfirmed) && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
              
              {isPending && (
                <Button size="sm" onClick={handleCompleteAppointment} disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmer
                </Button>
              )}
              
              {isConfirmed && (
                <Button size="sm" variant="default" onClick={handleCompleteAppointment} disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Terminer
                </Button>
              )}
              
              {(isPending || isConfirmed) && (
                <Button variant="outline" size="sm" onClick={handleCancelAppointment} disabled={isLoading}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              )}
              
              {!isCompleted && !isCancelled && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
      
      {/* Dialogue de confirmation pour la suppression */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              {isBlockedTime 
                ? "Cette action est irréversible. La plage bloquée sera définitivement supprimée de votre agenda."
                : "Cette action est irréversible. Le rendez-vous sera définitivement supprimé de votre agenda."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={e => {
                e.preventDefault()
                handleDeleteAppointment()
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}