// src/components/appointments/appointment-view.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import AppointmentCalendar from "@/components/appointments/appointment-calendar"
import CalendarHeader from "@/components/appointments/calendar-header"
import CalendarLegend from "@/components/appointments/calendar-legend"
import AppointmentDetails from "@/components/appointments/appointment-details"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { BlockTimeForm } from "@/components/appointments/block-time-form"
import { Maximize2, Minimize2, Loader2 } from "lucide-react"

// Types simples pour les props
interface AppointmentViewProps {
  appointments?: any[];
  clients?: any[];
  services?: any[];
  availability?: any[];
}

export default function AppointmentView({ 
  appointments: initialAppointments = [], 
  clients: initialClients = [], 
  services: initialServices = [],
  availability: initialAvailability = []
}: AppointmentViewProps) {
  const { data: session } = useSession()
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('week')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [appointments, setAppointments] = useState(initialAppointments)
  const [clients, setClients] = useState(initialClients)
  const [services, setServices] = useState(initialServices)
  const [availability, setAvailability] = useState(initialAvailability)
  const [isLoading, setIsLoading] = useState(false)
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false)
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false)
  const selectedDateRef = useRef<Date | null>(null)
  
  // Chargement initial des données
  useEffect(() => {
    if (appointments.length === 0 || clients.length === 0 || services.length === 0) {
      loadData(true)
    }
  }, [session?.user?.id])
  
  // Charger les données
  const loadData = async (showLoading = false) => {
    if (!session?.user?.id) return
    
    if (showLoading) setIsLoading(true)
    
    try {
      // Charger les rendez-vous
      const appointmentsRes = await fetch(`/api/users/${session.user.id}/appointments`)
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData)
      }
      
      // Charger les clients
      if (clients.length === 0) {
        const clientsRes = await fetch(`/api/users/${session.user.id}/clients`)
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(clientsData)
        }
      }
      
      // Charger les services
      if (services.length === 0) {
        const servicesRes = await fetch(`/api/users/${session.user.id}/services`)
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          // Filtrer le service "Blocage de plage" pour qu'il n'apparaisse pas dans la liste
          const filteredServices = servicesData.filter((service: any) => service.name !== "Blocage de plage")
          setServices(filteredServices)
        }
      }
      
      // Charger les disponibilités
      if (availability.length === 0) {
        const availabilityRes = await fetch(`/api/users/${session.user.id}/availability`)
        if (availabilityRes.ok) {
          const availabilityData = await availabilityRes.json()
          setAvailability(availabilityData.timeSlots || [])
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }
  
  // Navigation dans le calendrier
  const handlePreviousDate = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }
  
  const handleNextDate = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }
  
  const handleToday = () => {
    setCurrentDate(new Date())
  }
  
  // Gestionnaire pour la sélection d'un rendez-vous
  const handleAppointmentClick = (info: any) => {
    const appointment = appointments.find(app => app.id === info.event.id)
    if (appointment) {
      setSelectedAppointment(appointment)
    }
  }
  
  // Gestionnaire pour la sélection d'une date dans le calendrier
  const handleDateSelect = (info: any) => {
    selectedDateRef.current = info.start
    
    // Par défaut, ouvrir le formulaire de nouveau rendez-vous
    setIsNewAppointmentOpen(true)
  }
  
  // Gestionnaire pour créer un nouveau rendez-vous
  const handleCreateAppointment = async (data: any) => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Gestion plus précise des conflits
        if (response.status === 409) {
          toast.error(errorData.error || "Ce créneau horaire est déjà occupé. Veuillez supprimer ou annuler le conflit d'abord.")
          return Promise.reject(new Error("Conflit de rendez-vous"))
        }
        
        throw new Error(errorData.error || "Échec de la création du rendez-vous")
      }
      
      const newAppointment = await response.json()
      
      // Mettre à jour la liste locale
      setAppointments(prev => [...prev, newAppointment])
      
      toast.success("Rendez-vous créé avec succès")
      setIsNewAppointmentOpen(false)
      
      return Promise.resolve()
    } catch (error) {
      if (!(error instanceof Error && error.message === "Conflit de rendez-vous")) {
        toast.error("Erreur lors de la création du rendez-vous")
      }
      
      return Promise.reject(error)
    }
  }
  
  // Gestionnaire pour créer une plage bloquée
  const handleCreateBlockedTime = async (data: any) => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/blocked-times`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Gestion plus précise des conflits
        if (response.status === 409) {
          toast.error(errorData.error || "Ce créneau horaire est déjà occupé. Veuillez supprimer ou annuler le conflit d'abord.")
          return Promise.reject(new Error("Conflit de plage horaire"))
        }
        
        throw new Error(errorData.error || "Échec du blocage de la plage horaire")
      }
      
      const newBlockedTime = await response.json()
      
      // Mettre à jour la liste locale
      setAppointments(prev => [...prev, newBlockedTime])
      
      toast.success("Plage horaire bloquée avec succès")
      setIsBlockTimeOpen(false)
      
      return Promise.resolve()
    } catch (error) {
      if (!(error instanceof Error && error.message === "Conflit de plage horaire")) {
        toast.error("Erreur lors du blocage de la plage horaire")
      }
      
      return Promise.reject(error)
    }
  }
  
  // Gestionnaire pour mettre à jour un rendez-vous
  const handleUpdateAppointment = async (data: any) => {
    if (!session?.user?.id || !selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Gestion plus précise des conflits
        if (response.status === 409) {
          toast.error(errorData.error || "Ce créneau horaire est déjà occupé. Veuillez supprimer ou annuler le conflit d'abord.")
          return Promise.reject(new Error("Conflit de rendez-vous"))
        }
        
        throw new Error(errorData.error || "Échec de la mise à jour du rendez-vous")
      }
      
      const updatedAppointment = await response.json()
      
      // Mettre à jour la liste locale
      setAppointments(prev => 
        prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app)
      )
      
      // Mettre à jour le rendez-vous sélectionné
      setSelectedAppointment(updatedAppointment)
      
      toast.success("Rendez-vous mis à jour avec succès")
      setIsEditAppointmentOpen(false)
      
      return Promise.resolve()
    } catch (error) {
      if (!(error instanceof Error && error.message === "Conflit de rendez-vous")) {
        toast.error("Erreur lors de la mise à jour du rendez-vous")
      }
      
      return Promise.reject(error)
    }
  }
  
  // Gestionnaire pour annuler un rendez-vous
  const handleCancelAppointment = async () => {
    if (!session?.user?.id || !selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "CANCELLED"
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de l'annulation du rendez-vous")
      }
      
      const updatedAppointment = await response.json()
      
      // Mettre à jour la liste locale
      setAppointments(prev => 
        prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app)
      )
      
      // Mettre à jour le rendez-vous sélectionné
      setSelectedAppointment(updatedAppointment)
      
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur lors de l'annulation du rendez-vous:", error)
      return Promise.reject(error)
    }
  }
  
  // Gestionnaire pour marquer un rendez-vous comme terminé
  const handleCompleteAppointment = async () => {
    if (!session?.user?.id || !selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "COMPLETED"
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de la validation du rendez-vous")
      }
      
      const updatedAppointment = await response.json()
      
      // Mettre à jour la liste locale
      setAppointments(prev => 
        prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app)
      )
      
      // Mettre à jour le rendez-vous sélectionné
      setSelectedAppointment(updatedAppointment)
      
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur lors de la validation du rendez-vous:", error)
      return Promise.reject(error)
    }
  }
  
  // Gestionnaire pour supprimer un rendez-vous ou une plage bloquée
  const handleDeleteAppointment = async () => {
    if (!session?.user?.id || !selectedAppointment) return
    
    try {
      // Déterminer s'il s'agit d'une plage bloquée système
      const isSystemBlock = selectedAppointment.status === "CANCELLED" && 
                          selectedAppointment.client?.user?.email === "system@serenibook.app"
      
      // URL différente selon le type
      const url = isSystemBlock 
        ? `/api/users/${session.user.id}/blocked-times/${selectedAppointment.id}`
        : `/api/users/${session.user.id}/appointments/${selectedAppointment.id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de la suppression")
      }
      
      // Supprimer de la liste locale
      setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id))
      
      // Désélectionner le rendez-vous
      setSelectedAppointment(null)
      
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      return Promise.reject(error)
    }
  }
  
  // Gestionnaire pour éditer un rendez-vous
  const handleEditAppointment = () => {
    if (!selectedAppointment) return
    
    // Ouvrir le formulaire d'édition
    setIsEditAppointmentOpen(true)
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-title font-medium">Gestion des rendez-vous</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsBlockTimeOpen(true)}
          >
            Bloquer une plage
          </Button>
          <Button 
            variant="default"
            size="sm"
            onClick={() => setIsNewAppointmentOpen(true)}
          >
            Nouveau rendez-vous
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-3 gap-6'}`}>
        {/* Calendrier principal */}
        <div className={isFullscreen ? "col-span-1" : "col-span-2"}>
          <Card>
            <CardContent className="pt-4">
              {/* En-tête du calendrier */}
              <CalendarHeader 
                currentDate={currentDate}
                view={calendarView}
                onViewChange={setCalendarView}
                onPrev={handlePreviousDate}
                onNext={handleNextDate}
                onToday={handleToday}
              />
              
              {/* Calendrier */}
              <div className={isFullscreen ? "min-h-[calc(100vh-220px)]" : "min-h-[600px]"}>
                <AppointmentCalendar 
                  appointments={appointments} 
                  view={calendarView}
                  currentDate={currentDate}
                  availability={availability}
                  onEventClick={handleAppointmentClick}
                  onDateSelect={handleDateSelect}
                />
              </div>
              
              {/* Légende du calendrier */}
              <CalendarLegend />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Détails du rendez-vous sélectionné */}
        {!isFullscreen && (
          <div className="col-span-1">
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
                <CardContent className="py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <h3 className="font-medium mb-2">Détails du rendez-vous</h3>
                    <p>Sélectionnez un rendez-vous pour voir les détails</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Formulaires modaux */}
      {isNewAppointmentOpen && (
        <AppointmentForm 
          open={isNewAppointmentOpen}
          onOpenChange={setIsNewAppointmentOpen}
          onSubmit={handleCreateAppointment}
          defaultValues={{
            date: selectedDateRef.current ? selectedDateRef.current.toISOString().split('T')[0] : undefined,
            startTime: selectedDateRef.current ? selectedDateRef.current.toTimeString().substring(0, 5) : undefined
          }}
          clients={clients}
          services={services.filter(service => service.name !== "Blocage de plage")}
        />
      )}

      {isEditAppointmentOpen && selectedAppointment && (
        <AppointmentForm 
          open={isEditAppointmentOpen}
          onOpenChange={setIsEditAppointmentOpen}
          onSubmit={handleUpdateAppointment}
          defaultValues={{
            clientId: selectedAppointment.client?.id,
            serviceId: selectedAppointment.service?.id,
            date: new Date(selectedAppointment.startTime).toISOString().split('T')[0],
            startTime: new Date(selectedAppointment.startTime).toTimeString().substring(0, 5),
            notes: selectedAppointment.notes
          }}
          clients={clients}
          services={services.filter(service => service.name !== "Blocage de plage")}
        />
      )}

      {isBlockTimeOpen && (
        <BlockTimeForm 
          open={isBlockTimeOpen}
          onOpenChange={setIsBlockTimeOpen}
          onSubmit={handleCreateBlockedTime}
          defaultValues={
            selectedDateRef.current ? {
              date: selectedDateRef.current.toISOString().split('T')[0],
              startTime: selectedDateRef.current.toTimeString().substring(0, 5),
              endTime: new Date(selectedDateRef.current.getTime() + 60*60*1000).toTimeString().substring(0, 5),
              title: "Absence"
            } : undefined
          }
        />
      )}
    </div>
  )
}