// src/components/clients/appointment-history.tsx
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Check, X, AlertTriangle, Info } from "lucide-react"
import { useRouter } from "next/navigation"

interface AppointmentHistoryProps {
  appointments: any[]
  clientId: string
}

export function AppointmentHistory({ appointments, clientId }: AppointmentHistoryProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('fr-FR', options)
  }
  
  // Obtenir le style du badge en fonction du statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <Info className="h-3 w-3 mr-1" />
            Confirmé
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <X className="h-3 w-3 mr-1" />
            Annulé
          </Badge>
        )
      case "NO_SHOW":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            <X className="h-3 w-3 mr-1" />
            Absence
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Naviguer vers la page de détails du rendez-vous
  const navigateToAppointment = (appointmentId: string) => {
    router.push(`/rendez-vous/${appointmentId}`)
  }
  
  // Trier les rendez-vous par date (du plus récent au plus ancien)
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )
  
  // Limiter le nombre de rendez-vous affichés si pas étendu
  const displayedAppointments = expanded 
    ? sortedAppointments 
    : sortedAppointments.slice(0, 3)
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-6 border rounded-lg bg-gray-50">
        <p className="text-gray-500">Aucun rendez-vous pour ce client</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {displayedAppointments.map((appointment) => (
        <div 
          key={appointment.id}
          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
          onClick={() => navigateToAppointment(appointment.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium">{appointment.service.name}</span>
            {getStatusBadge(appointment.status)}
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formatDate(appointment.startTime)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>Durée : {appointment.service.duration} min</span>
            </div>
          </div>
        </div>
      ))}
      
      {appointments.length > 3 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Voir moins" : `Voir tous les ${appointments.length} rendez-vous`}
        </Button>
      )}
    </div>
  )
}