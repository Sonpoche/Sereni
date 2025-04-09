// src/components/appointments/appointment-view.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import AppointmentCalendar from "@/components/appointments/appointment-calendar"
import AppointmentSidebar from "@/components/appointments/appointment-sidebar"
import CalendarLegend from "@/components/appointments/calendar-legend"
import { Maximize2, Minimize2, Calendar, Filter, Clock } from "lucide-react"

// Définition des types
interface Appointment {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  client: {
    id: string;
    name?: string;
    user?: {
      name?: string;
      email?: string;
    };
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    color?: string;
  };
  notes?: string;
}

interface Client {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  color?: string;
}

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AppointmentViewProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  availability: TimeSlot[];
}

export default function AppointmentView({ 
  appointments, 
  clients, 
  services, 
  availability 
}: AppointmentViewProps) {
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('week');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Ajuster le style du calendrier en fonction du mode d'affichage
  const getCalendarHeightStyle = () => {
    return isFullscreen ? "min-h-[calc(100vh-220px)]" : "min-h-[600px]";
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-title font-medium">Gestion des rendez-vous</h1>
        <Button onClick={() => setIsFullscreen(!isFullscreen)}>
          {isFullscreen ? (
            <><Minimize2 className="mr-2 h-4 w-4" /> Réduire</>
          ) : (
            <><Maximize2 className="mr-2 h-4 w-4" /> Plein écran</>
          )}
        </Button>
      </div>

      <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-3 gap-6'}`}>
        {/* Calendrier principal */}
        <div className={isFullscreen ? "col-span-1" : "col-span-2"}>
          <Card>
            <CardContent className="pt-4">
              {/* Contrôles du calendrier */}
              <div className="flex justify-between items-center mb-4">
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
                
                {isFullscreen && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrer
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Aujourd'hui
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Calendrier dans un div ayant la classe pour la hauteur */}
              <div className={getCalendarHeightStyle()}>
                <AppointmentCalendar 
                  appointments={appointments} 
                  view={calendarView}
                  availability={availability}
                  onEventClick={(info) => {
                    const appointment = appointments.find(app => app.id === info.event.id);
                    if (appointment) setSelectedAppointment(appointment);
                  }}
                  onDateSelect={(info) => {/* Logique pour sélection */}}
                />
              </div>
              
              {/* Légende du calendrier */}
              <CalendarLegend />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (masquée en mode plein écran) */}
        {!isFullscreen && (
          <div className="col-span-1">
            <AppointmentSidebar />
          </div>
        )}
      </div>
    </div>
  )
}