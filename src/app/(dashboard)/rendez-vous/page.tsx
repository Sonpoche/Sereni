// src/app/(dashboard)/rendez-vous/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Clock, Users, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import AppointmentCalendar from "@/components/appointments/appointment-calendar"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import AppointmentDetails from "@/components/appointments/appointment-details"
import CalendarHeader from "@/components/appointments/calendar-header"
import { BlockTimeForm } from "@/components/appointments/block-time-form"
import { Badge } from "@/components/ui/badge"

export default function RendezVousPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [availability, setAvailability] = useState<any[]>([])
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
  
  // États pour les cours collectifs (affichage uniquement)
  const [showGroupClasses, setShowGroupClasses] = useState(true)

  // Charger les données initiales
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        
        // Charger les rendez-vous individuels ET les cours collectifs en parallèle
        const [appointmentsRes, groupClassesRes, clientsRes, servicesRes, availabilityRes] = await Promise.all([
          fetch(`/api/users/${session.user.id}/appointments`),
          fetch(`/api/users/${session.user.id}/cours-collectifs`),
          fetch(`/api/users/${session.user.id}/clients`),
          fetch(`/api/users/${session.user.id}/services`),
          fetch(`/api/users/${session.user.id}/availability`)
        ])
        
        if (!appointmentsRes.ok) {
          throw new Error("Erreur lors du chargement des rendez-vous")
        }
        
        const appointmentsData = await appointmentsRes.json()
        
        // Traitement des cours collectifs (affichage uniquement)
        let groupSessionsAsAppointments = []
        if (groupClassesRes.ok) {
          const groupClassesData = await groupClassesRes.json()
          
          // Transformer les sessions de cours collectifs en format rendez-vous
          groupSessionsAsAppointments = groupClassesData.flatMap((groupClass: any) => 
            groupClass.sessions
              .filter((session: any) => new Date(session.startTime) > new Date()) // Seulement les futures
              .map((session: any) => ({
                id: `group-${session.id}`,
                startTime: session.startTime,
                endTime: session.endTime,
                status: session.status === "SCHEDULED" ? "CONFIRMED" : session.status,
                notes: session.notes,
                isGroupClass: true,
                groupClassData: {
                  sessionId: session.id,
                  groupClassId: groupClass.id,
                  name: groupClass.name,
                  maxParticipants: groupClass.maxParticipants,
                  currentParticipants: session.currentParticipants,
                  category: groupClass.category,
                  isOnline: groupClass.isOnline,
                  city: groupClass.city,
                  price: groupClass.price
                },
                // Format compatible avec le calendrier existant
                client: null,
                service: {
                  id: `group-service-${groupClass.id}`,
                  name: groupClass.name,
                  duration: groupClass.duration,
                  price: groupClass.price,
                  color: "#10B981" // Couleur verte pour les cours collectifs
                }
              }))
          )
        }
        
        // Combiner tous les rendez-vous
        const allAppointments = [
          ...appointmentsData.filter((apt: any) => !apt.isGroupClass), // Rendez-vous individuels
          ...(showGroupClasses ? groupSessionsAsAppointments : []) // Cours collectifs si activés
        ].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        
        setAppointments(allAppointments)
        
        // Charger les clients
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(clientsData)
        }
        
        // Charger les services
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          // Filtrer le service de blocage des plages ET les services de groupe
          const filteredServices = servicesData.filter((service: any) => 
            service.name !== "Blocage de plage" && 
            service.active !== false &&
            !service.isGroupService // Exclure les services de groupe
          )
          setServices(filteredServices)
        }
        
        // Charger les disponibilités
        if (availabilityRes.ok) {
          const availabilityData = await availabilityRes.json()
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
  }, [session, showGroupClasses])

  // Rafraîchir les rendez-vous
  const refreshAppointments = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const [appointmentsRes, groupClassesRes] = await Promise.all([
        fetch(`/api/users/${session.user.id}/appointments`),
        fetch(`/api/users/${session.user.id}/cours-collectifs`)
      ])
      
      if (!appointmentsRes.ok) {
        throw new Error("Erreur lors du rafraîchissement des rendez-vous")
      }
      
      const appointmentsData = await appointmentsRes.json()
      
      // Traitement des cours collectifs
      let groupSessionsAsAppointments = []
      if (groupClassesRes.ok) {
        const groupClassesData = await groupClassesRes.json()
        
        groupSessionsAsAppointments = groupClassesData.flatMap((groupClass: any) => 
          groupClass.sessions
            .filter((session: any) => new Date(session.startTime) > new Date())
            .map((session: any) => ({
              id: `group-${session.id}`,
              startTime: session.startTime,
              endTime: session.endTime,
              status: session.status === "SCHEDULED" ? "CONFIRMED" : session.status,
              notes: session.notes,
              isGroupClass: true,
              groupClassData: {
                sessionId: session.id,
                groupClassId: groupClass.id,
                name: groupClass.name,
                maxParticipants: groupClass.maxParticipants,
                currentParticipants: session.currentParticipants,
                category: groupClass.category,
                isOnline: groupClass.isOnline,
                city: groupClass.city,
                price: groupClass.price
              },
              client: null,
              service: {
                id: `group-service-${groupClass.id}`,
                name: groupClass.name,
                duration: groupClass.duration,
                price: groupClass.price,
                color: "#10B981"
              }
            }))
        )
      }
      
      const allAppointments = [
        ...appointmentsData.filter((apt: any) => !apt.isGroupClass),
        ...(showGroupClasses ? groupSessionsAsAppointments : [])
      ].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      
      setAppointments(allAppointments)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du rafraîchissement des rendez-vous")
    }
  }, [session, showGroupClasses])

  // Fonction pour vérifier les conflits d'horaires avec l'API
  const checkTimeConflict = async (newStart: Date, newEnd: Date, excludeId?: string) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/check-conflicts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          excludeId: excludeId
        }),
      })
      
      if (!response.ok) {
        console.error("Erreur lors de la vérification des conflits")
        return false
      }
      
      const result = await response.json()
      return result.hasConflicts
    } catch (error) {
      console.error("Erreur lors de la vérification des conflits:", error)
      return false
    }
  }

  // Fonction pour supprimer une séance de cours collectif
  const handleDeleteGroupSession = async (sessionId: string, groupClassId: string) => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(
        `/api/users/${session.user.id}/cours-collectifs/${groupClassId}/sessions/${sessionId}`, 
        { method: "DELETE" }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }
      
      const result = await response.json()
      
      // Recharger les rendez-vous
      await refreshAppointments()
      
      if (result.notificationsSent > 0) {
        toast.success(`Séance supprimée. ${result.notificationsSent} participant(s) notifié(s).`)
      } else {
        toast.success("Séance supprimée avec succès")
      }
      
      // Fermer le panneau de détails si c'était la séance sélectionnée
      if (selectedAppointment?.id === `group-${sessionId}`) {
        setSelectedAppointment(null)
      }
      
    } catch (error) {
      console.error("Erreur:", error)
      toast.error((error as Error).message || "Erreur lors de la suppression")
    }
  }

  // Navigation du calendrier
  const handlePrevious = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.prev()
    }
  }, [])

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.next()
    }
  }, [])

  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.today()
    }
  }, [])

  const handleDateNavigate = useCallback((date: Date) => {
    if (!isUpdatingDate && date.getTime() !== currentDate.getTime()) {
      setIsUpdatingDate(true)
      setCurrentDate(date)
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

  // Gestion du formulaire de rendez-vous (individuel uniquement)
  const handleAppointmentSubmit = async (data: any) => {
    try {
      console.log("Création d'un rendez-vous individuel:", data);
      
      // Vérifier les conflits avant de créer
      const serviceSelected = services.find(s => s.id === data.serviceId)
      if (serviceSelected) {
        const startTime = new Date(`${data.date}T${data.startTime}`)
        const endTime = new Date(startTime.getTime() + serviceSelected.duration * 60000)
        
        const hasConflict = await checkTimeConflict(startTime, endTime, data.excludeId)
        
        if (hasConflict) {
          toast.error("Ce créneau entre en conflit avec un rendez-vous ou cours collectif existant")
          return Promise.reject(new Error("Conflit d'horaire"))
        }
      }
      
      const response = await fetch(`/api/users/${session?.user?.id}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du rendez-vous:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du rendez-vous");
      return Promise.reject(error);
    }
  };

  // Gestion du blocage de plage horaire
  const handleBlockTimeSubmit = async (data: any) => {
    try {
      // Vérifier les conflits avant de bloquer
      const hasConflict = await checkTimeConflict(
        new Date(`${data.date}T${data.startTime}`),
        new Date(`${data.date}T${data.endTime}`)
      )
      
      if (hasConflict) {
        toast.error("Ce créneau entre en conflit avec un rendez-vous ou cours collectif existant")
        return Promise.reject(new Error("Conflit d'horaire"))
      }
      
      const response = await fetch(`/api/users/${session?.user?.id}/blocked-times`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 409) {
          const error = new Error(errorData.message || "Ce créneau chevauche un rendez-vous ou une plage bloquée existante");
          // @ts-ignore
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
      // Si c'est un cours collectif, utiliser la fonction spécifique
      if (selectedAppointment.isGroupClass) {
        await handleDeleteGroupSession(
          selectedAppointment.groupClassData.sessionId,
          selectedAppointment.groupClassData.groupClassId
        )
        return
      }
      
      // Sinon, suppression normale d'un rendez-vous
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
    
    // Ne pas permettre l'édition des cours collectifs depuis cette page
    if (selectedAppointment.isGroupClass) {
      toast.info("Pour modifier un cours collectif, rendez-vous dans la section 'Mes cours collectifs'")
      return
    }
    
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
        <div className="flex items-center space-x-4">
          {/* Toggle pour les cours collectifs (affichage uniquement) */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showGroupClasses ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGroupClasses(!showGroupClasses)}
              className="gap-2"
            >
              {showGroupClasses ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <Users className="h-4 w-4" />
              Cours collectifs
            </Button>
          </div>
          
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
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendrier */}
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
                  onCancel={selectedAppointment.isGroupClass ? async () => {} : handleCancelAppointment}
                  onComplete={selectedAppointment.isGroupClass ? async () => {} : handleCompleteAppointment}
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
      
      {/* Formulaire de rendez-vous (individuel uniquement) */}
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