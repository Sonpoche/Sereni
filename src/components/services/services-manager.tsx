// src/components/services/services-manager.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Plus, Edit, Trash2, Clock, Euro, Palette } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

// Interface pour le service
interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
  maxParticipants?: number;
  type?: string;
  location?: string;
  active: boolean;
  professionalId: string;
}

// Interface pour les données du profil
interface ProfileData {
  id?: string;
  name?: string;
  professionalProfile?: {
    id?: string;
  };
}

const serviceSchema = z.object({
  name: z.string().min(3, "Le nom du service doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.number().min(5, "La durée minimum est de 5 minutes").max(480, "La durée maximum est de 8 heures"),
  price: z.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().optional(),
  maxParticipants: z.number().default(1),
  type: z.string().optional(),
  location: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export default function ServicesManager({ profileData }: { profileData: ProfileData }) {
  const { data: session } = useSession()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null)
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)

  // Configuration du formulaire
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 60,
      price: 0,
      color: "#6746c3", // Couleur par défaut (lavande)
      maxParticipants: 1,
      type: "",
      location: "",
    }
  })

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
  const editService = (service: Service) => {
    setCurrentServiceId(service.id)
    
    // Remplir le formulaire avec les données du service
    form.reset({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: Number(service.price),
      color: service.color || "#6746c3",
      maxParticipants: service.maxParticipants || 1,
      type: service.type || "",
      location: service.location || "",
    })
    
    setIsDialogOpen(true)
  }
  
  // Pour la création d'un nouveau service
  const addNewService = () => {
    setCurrentServiceId(null)
    form.reset({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      color: "#6746c3",
      maxParticipants: 1,
      type: "",
      location: "",
    })
    setIsDialogOpen(true)
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

  // Soumission du formulaire
  async function onSubmit(data: ServiceFormValues) {
    setIsSubmitting(true)
    
    try {
      const url = currentServiceId 
        ? `/api/users/${session?.user?.id}/services/${currentServiceId}`
        : `/api/users/${session?.user?.id}/services`
        
      const method = currentServiceId ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement du service")
      }

      const savedService = await response.json()
      
      // Mettre à jour la liste des services
      if (currentServiceId) {
        setServices(prevServices => 
          prevServices.map(service => 
            service.id === currentServiceId ? savedService : service
          )
        )
        toast.success("Service mis à jour avec succès")
      } else {
        setServices(prevServices => [...prevServices, savedService])
        toast.success("Service créé avec succès")
      }
      
      // Fermer le dialogue et réinitialiser
      setIsDialogOpen(false)
      setCurrentServiceId(null)
      form.reset()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'enregistrement du service")
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <CardTitle className="flex justify-between">
                <span>{service.name}</span>
                <span className="text-xl">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(service.price))}</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> 
                {service.duration} minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {service.description || "Aucune description"}
              </p>
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

      {/* Dialogue pour ajouter/modifier un service */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentServiceId ? "Modifier le service" : "Ajouter un service"}</DialogTitle>
            <DialogDescription>
              {currentServiceId 
                ? "Modifiez les détails de votre service ci-dessous." 
                : "Créez un nouveau service à proposer à vos clients."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Formulaire similaire à celui de ServicesTab */}
              {/* ... */}
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : currentServiceId ? "Mettre à jour" : "Créer le service"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le service sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteService}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}