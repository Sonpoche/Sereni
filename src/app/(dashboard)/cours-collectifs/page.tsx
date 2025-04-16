// src/app/(dashboard)/cours-collectifs/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Loader2, Plus, Calendar, Users } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { GroupClassDetails } from "@/components/appointments/group-class-details"

export default function CoursCollectifsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedClassId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [groupClasses, setGroupClasses] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  
  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        
        // Charger les cours collectifs
        const classesResponse = await fetch(`/api/users/${session.user.id}/group-classes`)
        if (!classesResponse.ok) {
          throw new Error("Erreur lors du chargement des cours collectifs")
        }
        const classesData = await classesResponse.json()
        setGroupClasses(classesData)
        
        // Si un ID est fourni dans l'URL, sélectionner automatiquement ce cours
        if (selectedClassId && classesData.length > 0) {
          const foundClass = classesData.find((c: any) => c.id === selectedClassId)
          if (foundClass) {
            setSelectedClass(foundClass)
          }
        }
        
        // Charger les clients
        const clientsResponse = await fetch(`/api/users/${session.user.id}/clients`)
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData)
        }
        
        // Charger les services de groupe
        const servicesResponse = await fetch(`/api/users/${session.user.id}/services`)
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          // Filtrer pour n'obtenir que les services de groupe
          const groupServices = servicesData.filter((service: any) => 
            service.maxParticipants > 1 && service.active !== false
          )
          setServices(groupServices)
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [session?.user?.id, selectedClassId])
  
  // Créer un nouveau cours collectif
  const handleCreateGroupClass = async (data: any) => {
    if (!session?.user?.id) return;
    
    try {
      console.log("Données du formulaire:", data);
      
      // S'assurer que c'est bien un cours collectif
      const formData = {
        serviceId: data.serviceId,
        date: data.date,
        startTime: data.startTime,
        notes: data.notes || "",
        maxParticipants: data.maxParticipants || 10,
        isGroupClass: true,
      };
      
      console.log("Données envoyées à l'API:", formData);
      
      const response = await fetch(`/api/users/${session.user.id}/group-classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        throw new Error(errorData.error || "Erreur lors de la création du cours collectif");
      }
      
      const newClass = await response.json();
      console.log("Nouveau cours créé:", newClass);
      
      // Mettre à jour la liste locale
      if (newClass.groupClass) {
        setGroupClasses(prev => [...prev, newClass.groupClass]);
      } else if (newClass.success) {
        // Actualiser la liste des cours
        await refreshGroupClasses();
      }
      
      setIsFormOpen(false);
      toast.success("Cours collectif créé avec succès");
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur détaillée:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du cours collectif");
      return Promise.reject(error);
    }
  };
  
  // Supprimer un cours collectif
  const handleDeleteGroupClass = async () => {
    if (!session?.user?.id || !selectedClass) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/group-classes/${selectedClass.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du cours collectif")
      }
      
      // Mettre à jour la liste locale
      setGroupClasses(prev => prev.filter(c => c.id !== selectedClass.id))
      setSelectedClass(null)
      
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur:", error)
      return Promise.reject(error)
    }
  }
  
  // Ajouter un participant
  const handleAddParticipant = async (clientId: string) => {
    if (!session?.user?.id || !selectedClass) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/group-classes/${selectedClass.id}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'ajout du participant")
      }
      
      // Recharger les données du cours
      await refreshSelectedClass()
      
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur:", error)
      return Promise.reject(error)
    }
  }
  
  // Supprimer un participant
  const handleRemoveParticipant = async (participantId: string) => {
    if (!session?.user?.id || !selectedClass) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/group-classes/${selectedClass.id}/participants?participantId=${participantId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du participant")
      }
      
      // Recharger les données du cours
      await refreshSelectedClass()
      
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur:", error)
      return Promise.reject(error)
    }
  }
  
  // Rafraîchir les données du cours sélectionné
  const refreshSelectedClass = async () => {
    if (!session?.user?.id || !selectedClass) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/group-classes/${selectedClass.id}`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des détails du cours")
      }
      
      const updatedClass = await response.json()
      
      // Mettre à jour la sélection et la liste
      setSelectedClass(updatedClass)
      setGroupClasses(prev => 
        prev.map(c => c.id === updatedClass.id ? updatedClass : c)
      )
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du rafraîchissement des données")
    }
  }
  
  // Fonction pour rafraîchir la liste des cours collectifs
  const refreshGroupClasses = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/group-classes`);
      if (response.ok) {
        const data = await response.json();
        setGroupClasses(data);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des cours:", error);
    }
  };
  
  // Formater la date pour l'affichage
  const formatClassDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Cours collectifs"
          description="Gérez vos cours et sessions de groupe"
        />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Cours collectifs"
        description="Gérez vos cours et sessions de groupe"
      >
        {services.length > 0 ? (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau cours collectif
          </Button>
        ) : (
          <Link href="/services">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un service de groupe
            </Button>
          </Link>
        )}
      </PageHeader>
      
      {services.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center">
            <div className="mb-4 flex justify-center">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Aucun service de groupe configuré</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Pour créer des cours collectifs, vous devez d'abord configurer un service qui permet d'accueillir plusieurs participants.
            </p>
            <Link href="/services">
              <Button>
                Configurer un service de groupe
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des cours collectifs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mes cours collectifs</CardTitle>
              </CardHeader>
              <CardContent>
                {groupClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun cours collectif</h3>
                    <p className="text-gray-500 mb-6">
                      Vous n'avez pas encore créé de cours collectif.
                    </p>
                    <Button onClick={() => setIsFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer mon premier cours
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupClasses.map((groupClass) => (
                      <div 
                        key={groupClass.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedClass?.id === groupClass.id 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedClass(groupClass)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{groupClass.service.name}</h3>
                            <p className="text-sm text-gray-500">
                              {formatClassDate(groupClass.startTime)}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            {groupClass.currentParticipants}/{groupClass.maxParticipants} participants
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Détails du cours sélectionné */}
          <div className="lg:col-span-1">
            {selectedClass ? (
              <GroupClassDetails
                groupClass={selectedClass}
                clients={clients}
                onEdit={() => {/* TODO: implement edit */}}
                onDelete={handleDeleteGroupClass}
                onAddParticipant={handleAddParticipant}
                onRemoveParticipant={handleRemoveParticipant}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <h3 className="text-lg font-medium mb-2">Détails du cours</h3>
                  <p className="text-gray-500">
                    Sélectionnez un cours pour voir ses détails et gérer les participants.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Formulaire de création de cours collectif */}
      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateGroupClass}
        clients={clients}
        services={services}
        defaultValues={{
          isGroupClass: true,
        }}
      />
    </div>
  )
}