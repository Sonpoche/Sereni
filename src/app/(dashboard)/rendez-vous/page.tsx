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
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)

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
          // Filtrer le service de blocage des plages
          const filteredServices = servicesData.filter((service: any) => 
            service.name !== "Blocage de plage" && service.active !== false
          )
          setServices(filteredServices)
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
  const handlePrevious = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.prev()
      // La mise à jour de currentDate sera gérée par onDateNavigate via datesSet
    }
  }, [])

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.next()
      // La mise à jour de currentDate sera gérée par onDateNavigate via datesSet
    }
  }, [])

  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.today()
      // La mise à jour de currentDate sera gérée par onDateNavigate via datesSet
    }
  }, [])

  const handleDateNavigate = useCallback((date: Date) => {
    // Vérifier si la date a réellement changé pour éviter les mises à jour inutiles
    if (!isUpdatingDate && date.getTime() !== currentDate.getTime()) {
      setIsUpdatingDate(true)
      setCurrentDate(date)
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        setIsUpdatingDate(false)
      }, 50)
    }
  }, [currentDate, isUpdatingDate])

  // Gestion des événements du calendrier
  const handleDateSelect = useCallback((info: any) => {
    setSelectedDate(info.start)
    setSelectedAppointment(null)
    setFormDefaultValues({
      date: info.startStr.split('T')[0],
      startTime: new Date(info.start).toTimeString().substring(0, 5)
    })
    setIsFormOpen(true)
  }, [])

  const handleEventClick = useCallback((info: any) => {
    const appointmentId = info.event.id
    const appointment = appointments.find((app: any) => app.id === appointmentId)
    if (appointment) {
      setSelectedAppointment(appointment)
    }
  }, [appointments])

  // Gestion des formulaires
  const handleAppointmentSubmit = async (data: any) => {
    try {
      // Cloner les données pour éviter de modifier l'original
      const formData = { ...data };
      
      // Vérifier si c'est un cours collectif
      if (formData.isGroupClass) {
        console.log("Création d'un cours collectif avec les données:", formData);
        
        // Préparer les données spécifiquement pour l'API des cours collectifs
        const groupClassData = {
          serviceId: formData.serviceId,
          date: formData.date,
          startTime: formData.startTime,
          maxParticipants: Number(formData.maxParticipants) || 10,
          notes: formData.notes || "",
          isGroupClass: true
        };
        
        console.log("Données formatées pour l'API des cours collectifs:", groupClassData);
        
        // Pour les cours collectifs, nous utilisons une API différente
        const response = await fetch(`/api/users/${session?.user?.id}/group-classes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(groupClassData),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error("Erreur cours collectif:", responseData);
          
          if (response.status === 409) {
            const error = new Error(responseData.message || "Conflit d'horaire");
            // @ts-ignore
            error.status = 409;
            throw error;
          }
          
          // Afficher les détails de validation si disponibles
          if (responseData.details && Array.isArray(responseData.details)) {
            console.error("Détails de validation:", responseData.details);
            const errorMessages = responseData.details.map((err: any) => 
              `${err.path.join('.')}: ${err.message}`
            ).join(', ');
            throw new Error(`Erreur de validation: ${errorMessages}`);
          }
          
          throw new Error(responseData.error || "Erreur lors de la création du cours collectif");
        }
        
        console.log("Cours collectif créé:", responseData);
        
        await refreshAppointments();
        setIsFormOpen(false);
        toast.success("Cours collectif créé avec succès");
        return Promise.resolve();
      } else {
        // Rendez-vous normal - code inchangé
        const response = await fetch(`/api/users/${session?.user?.id}/appointments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 409) {
            const error = new Error(errorData.message || "Ce créneau chevauche un rendez-vous existant");
            // @ts-ignore
            error.status = 409;
            throw error;
          }
          
          throw new Error(errorData.error || "Erreur lors de la création du rendez-vous");
        }
        
        await refreshAppointments();
        setIsFormOpen(false);
        toast.success("Rendez-vous créé avec succès");
        return Promise.resolve();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du rendez-vous:", error);
      // Afficher l'erreur à l'utilisateur
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du rendez-vous");
      return Promise.reject(error);
    }
  };

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

      // Vérifier le statut HTTP
      if (!response.ok) {
        const errorData = await response.json();
        
        // Cas spécifique pour les conflits (status 409)
        if (response.status === 409) {
          const error = new Error(errorData.message || "Ce créneau chevauche un rendez-vous ou une plage bloquée existante");
          // @ts-ignore - Ajout de propriétés personnalisées
          error.status = 409;
          error.message = errorData.message;
          throw error;
        }
        
        throw new Error(errorData.error || "Erreur lors du blocage de la plage horaire");
      }

      await refreshAppointments()
      toast.success("Plage horaire bloquée avec succès");
      setIsBlockTimeFormOpen(false);
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur:", error)
      return Promise.reject(error);
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
                currentDate={currentDate}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onDateNavigate={handleDateNavigate}
                availability={availability}
                calendarRef={calendarRef}
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