// src/app/(dashboard)/rendez-vous/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import AppointmentCalendar from "@/components/appointments/appointment-calendar"
import AppointmentSidebar from "@/components/appointments/appointment-sidebar"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import AppointmentDetails from "@/components/appointments/appointment-details"

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [availability, setAvailability] = useState([])
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('week')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [formDefaultValues, setFormDefaultValues] = useState<any | null>(null)
  const [sidebarActiveTab, setSidebarActiveTab] = useState("options")

  // Charger les rendez-vous et autres données au montage du composant
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        
        // Charger les rendez-vous
        const appointmentsResponse = await fetch(`/api/users/${session.user.id}/appointments`)
        if (!appointmentsResponse.ok) {
          throw new Error("Erreur lors du chargement des rendez-vous")
        }
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData)
        
        // Charger les clients
        const clientsResponse = await fetch(`/api/users/${session.user.id}/clients`)
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData)
        }
        
        // Charger les services
        const servicesResponse = await fetch(`/api/users/${session.user.id}/services`)
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          setServices(servicesData)
        }
        
        // Charger les disponibilités
        const availabilityResponse = await fetch(`/api/users/${session.user.id}/availability`)
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json()
          setAvailability(availabilityData.timeSlots || [])
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    
    if (session?.user?.id) {
      fetchInitialData()
    }
  }, [session])

  // Fonction pour rafraîchir les rendez-vous
  const refreshAppointments = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/appointments`)
      if (!response.ok) {
        throw new Error("Erreur lors du rafraîchissement des rendez-vous")
      }
      const data = await response.json()
      setAppointments(data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du rafraîchissement des rendez-vous")
    }
  }, [session])

  // Gestion des clics sur le calendrier
  const handleDateSelect = (info: any) => {
    setSelectedDate(info.start)
    setSelectedAppointment(null)
    setFormDefaultValues({
      date: info.startStr.split('T')[0],
      startTime: new Date(info.start).toTimeString().substring(0, 5)
    })
    setIsFormOpen(true)
    setSidebarActiveTab("options")
  }

  // Gestion des clics sur un événement
  const handleEventClick = (info: any) => {
    const appointmentId = info.event.id
    const appointment = appointments.find((app: any) => app.id === appointmentId)
    if (appointment) {
      setSelectedAppointment(appointment)
      setSidebarActiveTab("details")
    }
  }

  // Soumission du formulaire de rendez-vous
  const handleAppointmentSubmit = async (data: any) => {
    try {
      // Mettre à jour un rendez-vous existant ou en créer un nouveau
      const isUpdate = selectedAppointment !== null
      const url = isUpdate 
        ? `/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`
        : `/api/users/${session?.user?.id}/appointments`
      
      const method = isUpdate ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de ${isUpdate ? 'la mise à jour' : 'la création'} du rendez-vous`)
      }

      // Rafraîchir la liste des rendez-vous
      await refreshAppointments()
      
      toast.success(`Rendez-vous ${isUpdate ? 'mis à jour' : 'créé'} avec succès`)
      setIsFormOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Annuler un rendez-vous
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'annulation du rendez-vous")
      }

      // Rafraîchir la liste des rendez-vous
      await refreshAppointments()
      
      // Mettre à jour le rendez-vous sélectionné
      const updatedAppointment = await response.json()
      setSelectedAppointment(updatedAppointment)
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Marquer un rendez-vous comme terminé
  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const newStatus = selectedAppointment.status === "PENDING" ? "CONFIRMED" : "COMPLETED"
      
      const response = await fetch(`/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors du passage du rendez-vous à ${newStatus}`)
      }

      // Rafraîchir la liste des rendez-vous
      await refreshAppointments()
      
      // Mettre à jour le rendez-vous sélectionné
      const updatedAppointment = await response.json()
      setSelectedAppointment(updatedAppointment)
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Supprimer un rendez-vous
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du rendez-vous")
      }

      // Rafraîchir la liste des rendez-vous
      await refreshAppointments()
      
      // Réinitialiser le rendez-vous sélectionné
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Préparation pour édition d'un rendez-vous
  const handleEditAppointment = () => {
    if (!selectedAppointment) return
    
    const startDate = new Date(selectedAppointment.startTime)
    
    setFormDefaultValues({
      clientId: selectedAppointment.clientId,
      serviceId: selectedAppointment.serviceId,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().substring(0, 5),
      notes: selectedAppointment.notes || "",
    })
    
    setIsFormOpen(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p>Vous devez être connecté pour accéder à cette page.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-title font-medium">Gestion des rendez-vous</h1>
        <Button onClick={() => {
          setSelectedAppointment(null)
          setFormDefaultValues(null)
          setIsFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rendez-vous
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendrier principal (70%) */}
        <div className="lg:w-[70%]">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Calendrier</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant={calendarView === 'month' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setCalendarView('month')}
                  >
                    Mois
                  </Button>
                  <Button 
                    variant={calendarView === 'week' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setCalendarView('week')}
                  >
                    Semaine
                  </Button>
                  <Button 
                    variant={calendarView === 'day' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setCalendarView('day')}
                  >
                    Jour
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AppointmentCalendar 
                appointments={appointments} 
                view={calendarView}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                availability={availability}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (30%) */}
        <div className="lg:w-[30%]">
          <Tabs 
            defaultValue="options" 
            value={sidebarActiveTab}
            onValueChange={setSidebarActiveTab}
          >
            <TabsList className="w-full">
              <TabsTrigger value="options" className="flex-1">Options</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Détails</TabsTrigger>
            </TabsList>
            
            <TabsContent value="options">
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      setSelectedAppointment(null)
                      setFormDefaultValues(null)
                      setIsFormOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau rendez-vous
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Bloquer une plage
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Filtrer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Options de filtrage à implémenter */}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details">
              {selectedAppointment ? (
                <AppointmentDetails 
                  appointment={selectedAppointment}
                  onEdit={handleEditAppointment}
                  onCancel={handleCancelAppointment}
                  onComplete={handleCompleteAppointment}
                  onDelete={handleDeleteAppointment}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      Sélectionnez un rendez-vous pour voir ses détails
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Formulaire de création/édition de rendez-vous */}
      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAppointmentSubmit}
        defaultValues={formDefaultValues}
        clients={clients}
        services={services}
      />
    </div>
  )
}