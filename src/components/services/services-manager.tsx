// src/components/services/services-manager.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Plus, Edit, Trash2, Clock, Euro, Users } from "lucide-react"
import { ServiceForm } from "@/components/services/service-form"
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
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

export default function ServicesManager({ profileData }: { profileData: any }) {
  const { data: session } = useSession()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentService, setCurrentService] = useState<any | null>(null)
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)

  // Chargement des services
  useEffect(() => {
    const fetchServices = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${session.user.id}/services`)
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des services")
        }
        
        const data = await response.json()
        setServices(data)
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des services")
      } finally {
        setLoading(false)
      }
    }
    
    fetchServices()
  }, [session?.user?.id])

  // Pour l'édition d'un service existant
  const editService = (service: any) => {
    console.log("Service à modifier:", service); // Pour déboguer
    
    // Préparer les valeurs par défaut pour le formulaire
    const formValues = {
      name: service.name || "",
      description: service.description || "",
      duration: service.duration, // Déjà un nombre
      price: typeof service.price === 'string' ? parseFloat(service.price) : Number(service.price),
      color: service.color || "#6746c3",
      // Déterminer si c'est un service de groupe
      isGroupService: service.maxParticipants > 1,
      maxParticipants: service.maxParticipants > 1 ? service.maxParticipants : 10,
      location: service.location || "",
    };
    
    console.log("Valeurs par défaut pour le formulaire:", formValues); // Pour déboguer
    
    // Stocker les valeurs du service
    setCurrentService({...service, ...formValues});
    
    // Ouvrir le formulaire
    setIsFormOpen(true);
  }
  
  // Pour la création d'un nouveau service
  const addNewService = () => {
    setCurrentService(null)
    setIsFormOpen(true)
  }
  
  // Pour la suppression d'un service
  const confirmDeleteService = (serviceId: string) => {
    setDeleteServiceId(serviceId)
    setIsDeleteDialogOpen(true)
  }
  
  const deleteService = async () => {
    if (!deleteServiceId) return
    
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/services/${deleteServiceId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du service")
      }
      
      // Mettre à jour la liste des services
      setServices(prevServices => prevServices.filter(service => service.id !== deleteServiceId))
      toast.success("Service supprimé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du service")
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteServiceId(null)
    }
  }

  // Soumission du formulaire avec débogage et gestion améliorée des erreurs
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Préparer les données pour l'API
      const serviceData = {
        name: data.name,
        description: data.description,
        duration: Number(data.duration),
        price: Number(data.price),
        color: data.color,
        // Si c'est un service de groupe, utiliser maxParticipants, sinon 1
        maxParticipants: data.isGroupService ? Number(data.maxParticipants) : 1,
        location: data.location || null,
      };
      
      console.log("Données envoyées à l'API:", serviceData);
      
      const url = currentService 
        ? `/api/users/${session?.user?.id}/services/${currentService.id}`
        : `/api/users/${session?.user?.id}/services`;
        
      const method = currentService ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        // Récupérer le message d'erreur du serveur
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        
        // Afficher les détails de validation si disponibles
        if (errorData.details && Array.isArray(errorData.details)) {
          console.error("Détails de validation:", errorData.details);
          
          // Créer un message d'erreur plus informatif
          const errorMessages = errorData.details.map((err: any) => 
            `${err.path}: ${err.message}`
          ).join(', ');
          
          toast.error(`Données invalides: ${errorMessages}`);
          throw new Error(`Erreur de validation: ${errorMessages}`);
        }
        
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const savedService = await response.json();
      
      // Mettre à jour la liste des services
      if (currentService) {
        setServices(prevServices => 
          prevServices.map(service => 
            service.id === currentService.id ? savedService : service
          )
        );
        toast.success("Service mis à jour avec succès");
      } else {
        setServices(prevServices => [...prevServices, savedService]);
        toast.success("Service créé avec succès");
      }
      
      // Fermer le dialogue et réinitialiser
      setIsFormOpen(false);
      setCurrentService(null);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement du service");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Vue grille pour les services qui affiche plus d'informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
        {/* Carte pour ajouter un nouveau service */}
        <Card className="border-dashed border-2 border-gray-200 hover:border-primary/50 transition-colors cursor-pointer" onClick={addNewService}>
          <CardContent className="flex flex-col items-center justify-center h-full py-10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-lg">Ajouter un service</h3>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Créez un nouveau service à proposer à vos clients
            </p>
          </CardContent>
        </Card>
        
        {/* Affichage des services existants */}
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <div 
              className="h-2" 
              style={{ backgroundColor: service.color || '#6746c3' }}
            />
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{service.name}</CardTitle>
                {service.maxParticipants > 1 && (
                  <Badge variant="outline" className="ml-2">
                    <Users className="h-3 w-3 mr-1" />
                    Groupe ({service.maxParticipants})
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> 
                {service.duration} minutes
                <span className="mx-1">•</span>
                <span>{formatPrice(Number(service.price))}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {service.description || "Aucune description"}
              </p>
              {service.location && (
                <p className="text-xs text-gray-500 mt-2">
                  Lieu: {service.location}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => editService(service)}>
                <Edit className="h-4 w-4 mr-1" /> Modifier
              </Button>
              <Button variant="outline" size="sm" onClick={() => confirmDeleteService(service.id)}>
                <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                <span className="text-red-500">Supprimer</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Formulaire de service */}
      <ServiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        defaultValues={currentService ? {
          name: currentService.name,
          description: currentService.description || "",
          duration: currentService.duration,
          price: Number(currentService.price),
          color: currentService.color || "#6746c3",
          isGroupService: currentService.isGroupService,
          maxParticipants: currentService.maxParticipants > 1 ? currentService.maxParticipants : 10,
          location: currentService.location || "",
        } : undefined}
      />
      
      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le service sera définitivement supprimé de votre agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteService}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}