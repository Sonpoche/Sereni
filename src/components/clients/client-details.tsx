// src/components/clients/client-details.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditClientForm } from "./edit-client-form"
import { DeleteClientDialog } from "./delete-client-dialog"
import { AppointmentHistory } from "./appointment-history"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { type Client } from "./clients-container"
import { 
  Loader2, 
  Edit, 
  Trash, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar,
  CalendarPlus,
  Building
} from "lucide-react"

interface ClientDetailsProps {
  clientId: string
  onClientUpdated: (client: Client) => void
  onClientDeleted: (clientId: string) => void
}

export function ClientDetails({ 
  clientId, 
  onClientUpdated, 
  onClientDeleted 
}: ClientDetailsProps) {
  const { data: session } = useSession()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])

  // Chargement des détails du client
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!session?.user?.id || !clientId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${session.user.id}/clients/${clientId}`)
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des détails du client")
        }
        
        const data = await response.json()
        setClient(data.client)
        setAppointments(data.appointments || [])
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des détails du client")
      } finally {
        setLoading(false)
      }
    }
    
    fetchClientDetails()
  }, [session?.user?.id, clientId])

  // Gérer la mise à jour du client
  const handleUpdateClient = (updatedClient: Client) => {
    setClient(updatedClient)
    onClientUpdated(updatedClient)
    setIsEditModalOpen(false)
  }

  // Gérer la suppression du client
  const handleDeleteClient = async () => {
    if (!session?.user?.id || !clientId) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/clients/${clientId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du client")
      }
      
      onClientDeleted(clientId)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du client")
    }
  }

  // Formatage de la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date)
  }

  // Rediriger vers la page de prise de rendez-vous
  const handleNewAppointment = () => {
    if (client) {
      // Rediriger vers la page de prise de rendez-vous avec l'ID du client pré-rempli
      window.location.href = `/rendez-vous/nouveau?clientId=${client.id}`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!client) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-gray-500">Impossible de charger les détails du client</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex justify-between items-start">
            <span>{client.user.name}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 text-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-4">
            {/* Informations de contact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{client.user.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{client.phone}</span>
                </div>
              )}
              
              {/* Adresse si disponible */}
              {client.address && (
                <div className="flex items-start gap-2 mt-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <div>{client.address}</div>
                    {client.city && client.postalCode && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">
                          {client.postalCode} {client.city}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Ajouté le */}
            <div className="text-sm text-gray-500 pt-2">
              Client depuis le {formatDate(client.createdAt)}
            </div>
            
            {/* Notes si disponibles */}
            {client.notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Notes</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            className="w-full"
            onClick={handleNewAppointment}
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Nouveau rendez-vous
          </Button>
        </CardFooter>
      </Card>
      
      {/* Historique des rendez-vous */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Calendar className="h-4 w-4" />
            Historique des rendez-vous
            <Badge variant="outline" className="ml-auto">
              {appointments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentHistory appointments={appointments} clientId={client.id} />
        </CardContent>
      </Card>

      {/* Formulaire d'édition (modal) */}
      <EditClientForm
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        client={client}
        onClientUpdated={handleUpdateClient}
      />

      {/* Dialogue de confirmation de suppression */}
      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        clientName={client.user.name}
        onConfirmDelete={handleDeleteClient}
        appointmentsCount={appointments.length}
      />
    </>
  )
}