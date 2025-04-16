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
  Users
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
  
  // Détection du cours collectif
  const isGroupClass = appointment.isGroupClass === true;
  
  // Si c'est un cours collectif, afficher une interface spécifique
  if (isGroupClass) {
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
  
  // Détecter si c'est une absence/plage bloquée
  const isBlockedTime = appointment.status === "CANCELLED" && 
                      appointment.client?.user?.email === "system@serenibook.app";
  
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