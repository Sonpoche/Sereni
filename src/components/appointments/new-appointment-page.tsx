// src/components/appointments/new-appointment-page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"

interface NewAppointmentPageProps {
  professionalId: string
  preselectedClientId?: string
}

export default function NewAppointmentPage({
  professionalId,
  preselectedClientId
}: NewAppointmentPageProps) {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  // Charger les clients et les services
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les clients
        const clientsResponse = await fetch(`/api/users/${professionalId}/clients`)
        if (!clientsResponse.ok) throw new Error("Échec du chargement des clients")
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
        
        // Charger les services
        const servicesResponse = await fetch(`/api/users/${professionalId}/services`)
        if (!servicesResponse.ok) throw new Error("Échec du chargement des services")
        const servicesData = await servicesResponse.json()
        setServices(servicesData)
        
        setIsLoading(false)
        // Ouvrir automatiquement le formulaire une fois les données chargées
        setIsFormOpen(true)
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors du chargement des données")
        router.push('/rendez-vous')
      }
    }
    
    fetchData()
  }, [professionalId, router])
  
  const handleSubmitAppointment = async (data: any) => {
    try {
      const response = await fetch(`/api/users/${professionalId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de la création du rendez-vous")
      }
      
      toast.success("Rendez-vous créé avec succès")
      router.push('/rendez-vous')
      return Promise.resolve()
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la création du rendez-vous")
      return Promise.reject(error)
    }
  }
  
  // Préparer les valeurs par défaut pour le formulaire
  const defaultValues = preselectedClientId ? {
    clientId: preselectedClientId,
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00", // Heure par défaut
  } : undefined
  
  return (
    <div>
      <PageHeader
        title="Nouveau rendez-vous"
        description="Créez un nouveau rendez-vous en remplissant les informations ci-dessous"
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <AppointmentForm
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSubmit={handleSubmitAppointment}
              defaultValues={defaultValues}
              clients={clients}
              services={services}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}