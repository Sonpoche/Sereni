// src/components/appointments/group-class-details.tsx
"use client"

import { useState } from "react"
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
  Users, 
  Calendar, 
  Clock, 
  Tag, 
  FileText, 
  UserPlus,
  Trash,
  Edit
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GroupClassDetailsProps {
  groupClass: any // Type détaillé à définir selon votre modèle
  clients: any[] // Liste des clients pour l'inscription
  onEdit: () => void
  onDelete: () => Promise<void>
  onAddParticipant: (clientId: string) => Promise<void>
  onRemoveParticipant: (participantId: string) => Promise<void>
}

export function GroupClassDetails({
  groupClass,
  clients,
  onEdit,
  onDelete,
  onAddParticipant,
  onRemoveParticipant,
}: GroupClassDetailsProps) {
  const { data: session } = useSession()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [isRemovingParticipant, setIsRemovingParticipant] = useState<string | null>(null)
  
  // Formatage des dates
  const formattedDate = formatDate(new Date(groupClass.startTime))
  const startTime = new Date(groupClass.startTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  const endTime = new Date(groupClass.endTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const handleAddParticipant = async () => {
    if (!selectedClientId) return
    
    setIsLoading(true)
    try {
      await onAddParticipant(selectedClientId)
      setSelectedClientId("")
      toast.success("Participant ajouté avec succès")
    } catch (error) {
      console.error("Erreur lors de l'ajout du participant:", error)
      toast.error("Erreur lors de l'ajout du participant")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRemoveParticipant = async (participantId: string) => {
    setIsRemovingParticipant(participantId)
    try {
      await onRemoveParticipant(participantId)
      toast.success("Participant retiré avec succès")
    } catch (error) {
      console.error("Erreur lors du retrait du participant:", error)
      toast.error("Erreur lors du retrait du participant")
    } finally {
      setIsRemovingParticipant(null)
    }
  }
  
  // Filtrer les clients qui ne sont pas déjà inscrits
  const availableClients = clients.filter(client => 
    !groupClass.groupParticipants.some((p: any) => p.clientId === client.id)
  )
  
  const isFull = groupClass.currentParticipants >= groupClass.maxParticipants
  const remainingSpots = groupClass.maxParticipants - groupClass.currentParticipants

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle>{groupClass.service.name}</CardTitle>
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
                {groupClass.currentParticipants}/{groupClass.maxParticipants} participants
              </span>
              {isFull ? (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-300">Complet</Badge>
              ) : (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">
                  {remainingSpots} place{remainingSpots > 1 ? 's' : ''} disponible{remainingSpots > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Informations du cours */}
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
              <span>{groupClass.service.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </div>
          </div>
          
          {/* Notes */}
          {groupClass.notes && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Notes
              </h4>
              <p className="text-sm text-gray-600">{groupClass.notes}</p>
            </div>
          )}
          
          {/* Liste des participants */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium">Participants ({groupClass.groupParticipants.length})</h4>
            {groupClass.groupParticipants.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun participant inscrit</p>
            ) : (
              <ul className="space-y-2">
                {groupClass.groupParticipants.map((participant: any) => (
                  <li key={participant.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <span>{participant.client.user.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      disabled={isRemovingParticipant === participant.id}
                    >
                      {isRemovingParticipant === participant.id ? (
                        <span className="text-xs">Suppression...</span>
                      ) : (
                        <Trash className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Formulaire d'ajout de participant */}
            {!isFull && availableClients.length > 0 && (
              <div className="flex mt-2 gap-2">
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddParticipant}
                  disabled={!selectedClientId || isLoading}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
          >
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
              {groupClass.groupParticipants.length > 0 && (
                <strong className="block mt-2 text-red-600">
                  Attention : {groupClass.groupParticipants.length} participant(s) sont inscrits à ce cours.
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
  )
}