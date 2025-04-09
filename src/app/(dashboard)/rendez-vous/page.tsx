// src/app/(dashboard)/rendez-vous/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Clock } from "lucide-react"
import { toast } from "sonner"
import AppointmentCalendar from "@/components/appointments/appointment-calendar"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import AppointmentDetails from "@/components/appointments/appointment-details"
import CalendarHeader from "@/components/appointments/calendar-header"
import { BlockTimeForm } from "@/components/appointments/block-time-form"

export default function RendezVousPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [availability, setAvailability] = useState([])
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBlockTimeFormOpen, setIsBlockTimeFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [formDefaultValues, setFormDefaultValues] = useState<any | null>(null)
  const [blockTimeDefaultValues, setBlockTimeDefaultValues] = useState<any | null>(null)
  const calendarRef = useRef<any>(null)

  // Charger les données initiales
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

  // Rafraîchir les rendez-vous
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

  // Navigation du calendrier
  const handlePrevious = () => {
    if (calendarRef.current) {
      calendarRef.current.prev()
      setCurrentDate(calendarRef.current.getDate())
    }
  }

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.next()
      setCurrentDate(calendarRef.current.getDate())
    }
  }

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.today()
      setCurrentDate(calendarRef.current.getDate())
    }
  }

  // Gestion des événements du calendrier
  const handleDateSelect = (info: any) => {
    setSelectedDate(info.start)
    setSelectedAppointment(null)
    setFormDefaultValues({
      date: info.startStr.split('T')[0],
      startTime: new Date(info.start).toTimeString().substring(0, 5)
    })
    setIsFormOpen(true)
  }

  const handleEventClick = (info: any) => {
    const appointmentId = info.event.id
    const appointment = appointments.find((app: any) => app.id === appointmentId)
    if (appointment) {
      setSelectedAppointment(appointment)
    }
  }

  // Gestion des formulaires
  const handleAppointmentSubmit = async (data: any) => {
    try {
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

      await refreshAppointments()
      toast.success(`Rendez-vous ${isUpdate ? 'mis à jour' : 'créé'} avec succès`)
      setIsFormOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Gestion du blocage de plage horaire
  const handleBlockTimeSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/blocked-times`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erreur lors du blocage de la plage horaire")
      }

      await refreshAppointments()
      toast.success("Plage horaire bloquée avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Actions sur les rendez-vous
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })

      if (!response.ok) throw new Error("Erreur lors de l'annulation du rendez-vous")

      await refreshAppointments()
      const updatedAppointment = await response.json()
      setSelectedAppointment(updatedAppointment)
      toast.success("Rendez-vous annulé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'annulation du rendez-vous")
    }
  }

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const newStatus = selectedAppointment.status === "PENDING" ? "CONFIRMED" : "COMPLETED"
      
      const response = await fetch(`/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error(`Erreur lors du passage du rendez-vous à ${newStatus}`)

      await refreshAppointments()
      const updatedAppointment = await response.json()
      setSelectedAppointment(updatedAppointment)
      toast.success(`Rendez-vous ${newStatus === "CONFIRMED" ? "confirmé" : "terminé"} avec succès`)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du rendez-vous")
    }
  }

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/appointments/${selectedAppointment.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erreur lors de la suppression du rendez-vous")

      await refreshAppointments()
      setSelectedAppointment(null)
      toast.success("Rendez-vous supprimé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du rendez-vous")
    }
  }

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-title font-medium">Gestion des rendez-vous</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (selectedDate) {
                setBlockTimeDefaultValues({
                  date: selectedDate.toISOString().split('T')[0],
                  startTime: selectedDate.toTimeString().substring(0, 5),
                  endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5),
                  title: "Absence",
                })
              } else {
                setBlockTimeDefaultValues({
                  date: new Date().toISOString().split('T')[0],
                  startTime: "09:00",
                  endTime: "10:00",
                  title: "Absence",
                })
              }
              setIsBlockTimeFormOpen(true)
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Bloquer une plage
          </Button>
          <Button 
            onClick={() => {
              setSelectedAppointment(null)
              setFormDefaultValues(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau rendez-vous
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendrier amélioré */}
        <div className="lg:w-3/4">
          <Card>
            <CardHeader className="pb-0">
              <CalendarHeader 
                currentDate={currentDate}
                view={calendarView}
                onViewChange={setCalendarView}
                onPrev={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
              />
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

        {/* Panneau de détails */}
        <div className="lg:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedAppointment ? "Détails du rendez-vous" : "Nouveau rendez-vous"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAppointment ? (
                <AppointmentDetails 
                  appointment={selectedAppointment}
                  onEdit={handleEditAppointment}
                  onCancel={handleCancelAppointment}
                  onComplete={handleCompleteAppointment}
                  onDelete={handleDeleteAppointment}
                />
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    Sélectionnez un rendez-vous ou une plage horaire pour ajouter un nouveau rendez-vous
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau rendez-vous
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Formulaire de rendez-vous */}
      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAppointmentSubmit}
        defaultValues={formDefaultValues}
        clients={clients}
        services={services}
      />
      
      {/* Formulaire de blocage de plage horaire */}
      <BlockTimeForm
        open={isBlockTimeFormOpen}
        onOpenChange={setIsBlockTimeFormOpen}
        onSubmit={handleBlockTimeSubmit}
        defaultValues={blockTimeDefaultValues}
      />
    </div>
  )
}