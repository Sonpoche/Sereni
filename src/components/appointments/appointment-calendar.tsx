// src/components/appointments/appointment-calendar.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'

interface AppointmentCalendarProps {
  appointments: any[]
  view: 'month' | 'week' | 'day'
  onEventClick: (info: any) => void
  onDateSelect: (info: any) => void
  availability?: any[] // Plages horaires configurées par le praticien
}

export default function AppointmentCalendar({ 
  appointments, 
  view, 
  onEventClick, 
  onDateSelect,
  availability = []
}: AppointmentCalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarInstanceRef = useRef<Calendar | null>(null)
  const router = useRouter()
  const [showAvailabilityAlert, setShowAvailabilityAlert] = useState(false)

  // Vérifier si des horaires sont configurés
  useEffect(() => {
    if (availability.length === 0) {
      setShowAvailabilityAlert(true)
    } else {
      setShowAvailabilityAlert(false)
    }
  }, [availability])

  // Générer les plages horaires business en fonction des disponibilités configurées
  const getBusinessHours = () => {
    if (availability.length === 0) {
      // Valeurs par défaut si aucune disponibilité n'est configurée
      return {
        daysOfWeek: [1, 2, 3, 4, 5], // Lundi à vendredi
        startTime: '09:00',
        endTime: '19:00',
      }
    }

    return availability.map(slot => ({
      daysOfWeek: [slot.dayOfWeek],
      startTime: slot.startTime,
      endTime: slot.endTime
    }))
  }

  // Déterminer les jours fermés
  const getClosedDays = () => {
    const closedDays = [];
    
    // Parcourir tous les jours (0-6)
    for (let i = 0; i < 7; i++) {
      if (!availability.some(slot => slot.dayOfWeek === i)) {
        closedDays.push(i);
      }
    }
    
    return closedDays;
  }

  // Initialisation du calendrier
  useEffect(() => {
    if (calendarRef.current) {
      const calendarEl = calendarRef.current
      
      // Liste des jours fermés
      const closedDays = getClosedDays();
      
      // Supprimer toute balise style existante
      const oldStyle = document.getElementById('calendar-custom-style');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      // Ajouter du CSS personnalisé
      const style = document.createElement('style');
      style.id = 'calendar-custom-style';
      style.innerHTML = `
        /* Style personnalisé pour le calendrier */
        .fc-theme-standard .fc-view {
          background-color: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .fc .fc-timegrid-slot {
          height: 60px !important; /* Augmenté pour des cases plus grandes */
          border-bottom: 1px solid #f1f5f9;
        }
        .fc .fc-timegrid-body {
          min-height: 900px !important; /* Calendrier plus grand */
        }
        .fc .fc-col-header-cell {
          background-color: #F6F8F9;
          padding: 8px 0;
        }
        .fc .fc-col-header-cell-cushion {
          font-weight: 600;
          color: #334155;
          padding: 6px;
          text-decoration: none !important;
        }
        .fc .fc-timegrid-slot-label-cushion {
          font-weight: 500;
          color: #64748b;
          align-self: flex-start;
          margin-top: 4px;
        }
        .fc .fc-timegrid-slot-minor {
          border-top: 1px dashed #e2e8f0 !important;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-color: #67B3AB;
          border-width: 2px;
        }
        .fc .fc-timegrid-now-indicator-arrow {
          border-color: #67B3AB;
          border-width: 5px;
        }
        .fc .fc-event {
          border-radius: 4px;
          border: none;
          padding: 2px 4px;
          font-size: 0.875rem;
        }
        .fc .fc-event-title {
          font-weight: 500;
        }
        .fc .fc-event-time {
          font-weight: 400;
          font-size: 0.75rem;
        }
        .fc .fc-day-today {
          background-color: #e9f6f5 !important;
        }
        
        /* Styles pour les jours fermés - Vue mois */
        .fc-daygrid-day.fc-day-closed {
          background-color: #FEE2E2 !important;
        }
        .fc-daygrid-day.fc-day-closed .fc-daygrid-day-frame {
          position: relative;
        }
        .fc-daygrid-day.fc-day-closed .fc-daygrid-day-frame::after {
          content: "FERMÉ";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #991B1B;
          font-weight: bold;
          font-size: 14px;
          pointer-events: none;
          z-index: 1;
          background-color: #FEE2E2;
          padding: 2px 8px;
          border-radius: 4px;
          width: auto;
        }
        
        /* Styles pour les colonnes fermées - Vue semaine/jour */
        .fc-timegrid-col.fc-day-closed {
          background-color: #FEE2E2 !important;
          position: relative;
        }
        .fc-col-header-cell.fc-day-closed {
          background-color: #FEE2E2 !important;
        }
        .fc-timegrid-col.fc-day-closed::before {
          content: "FERMÉ";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-90deg);
          color: #991B1B;
          font-weight: bold;
          font-size: 16px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
          background-color: rgba(254, 226, 226, 0.8);
          padding: 2px 10px;
          border-radius: 4px;
          width: auto;
        }
        
        /* Pour que les tranches de 15 minutes soient bien visibles */
        .fc-timegrid-slot-minor {
          border-top: 1px dashed #e2e8f0 !important;
        }
        
        /* Masquer les événements et textes indésirables */
        .fc-daygrid-day.fc-day-closed .fc-daygrid-event-harness,
        .fc-timegrid-col.fc-day-closed .fc-timegrid-event-harness,
        .fc-event.fc-event-fermé,
        .fc-event.fc-daygrid-dot-event {
          display: none !important;
        }
        
        /* Suppression du petit carré vert */
        .fc-timegrid-event-harness .fc-timegrid-event::before,
        .fc-daygrid-event-harness .fc-daygrid-event::before,
        .fc-daygrid-dot-event::before {
          display: none !important;
        }
        
        /* Amélioration de l'affichage des heures pour les tranches de 15 minutes */
        .fc-timegrid-axis-frame {
          justify-content: flex-start !important;
          padding-top: 4px !important;
        }
        .fc-timegrid-slot-label {
          vertical-align: top !important;
        }
        .fc-timegrid-slot-label-frame {
          height: 60px !important; /* Ajusté pour correspondre à la hauteur des slots */
          display: flex !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
        }
      `;
      document.head.appendChild(style);
      
      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: view === 'month' ? 'dayGridMonth' : 
                    view === 'week' ? 'timeGridWeek' : 'timeGridDay',
        headerToolbar: false,
        locale: frLocale,
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00:00',
        snapDuration: '00:15:00',
        height: 'auto',
        contentHeight: view === 'week' ? 900 : 'auto', // Augmenté pour un calendrier plus grand
        businessHours: getBusinessHours(),
        nowIndicator: true,
        dayMaxEvents: true,
        selectable: true,
        selectMirror: true,
        eventDisplay: 'block',
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          omitZeroMinute: true
        },
        eventTimeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        eventBackgroundColor: '#67B3AB',
        eventBorderColor: '#519A94',
        eventTextColor: '#ffffff',
        events: appointments.map(appointment => ({
          id: appointment.id,
          title: appointment.service?.name || 'Rendez-vous',
          start: appointment.startTime,
          end: appointment.endTime,
          backgroundColor: appointment.service?.color || '#67B3AB',
          borderColor: appointment.service?.color || '#67B3AB',
          extendedProps: {
            clientName: appointment.client?.user?.name || appointment.client?.name || 'Client',
            clientEmail: appointment.client?.user?.email || appointment.client?.email || '',
            clientPhone: appointment.client?.phone || '',
            serviceName: appointment.service?.name || '',
            servicePrice: appointment.service?.price || 0,
            status: appointment.status,
          }
        })),
        // Personnaliser l'affichage des événements
        eventDidMount: function(info) {
          if (info.event.extendedProps.status === 'CANCELLED') {
            info.el.style.textDecoration = 'line-through';
            info.el.style.opacity = '0.6';
          }
          
          // Si l'événement a le titre "FERMÉ", le masquer
          if (info.event.title === 'FERMÉ') {
            info.el.classList.add('fc-event-fermé');
          }
          
          // Supprimer tout point/carré vert ou autre indicateur visuel non désiré
          const dots = info.el.querySelectorAll('.fc-daygrid-event-dot');
          dots.forEach(dot => dot.remove());
        },
        
        // Fonction qui s'exécute après un changement de vue ou de dates
        datesSet: function(info) {
          setTimeout(() => {
            applyClosedDaysStyle();
          }, 100);
        },
        
        // Empêcher la sélection sur les jours fermés
        selectAllow: function(selectInfo) {
          const startDay = selectInfo.start.getDay();
          return !closedDays.includes(startDay);
        },
        
        eventClick: onEventClick,
        
        select: function(info) {
          // Vérifier si le jour est fermé
          const dayOfWeek = info.start.getDay();
          if (!closedDays.includes(dayOfWeek)) {
            onDateSelect(info);
          } else {
            calendar.unselect();
          }
        },
      });
      
      // Fonction pour appliquer les styles aux jours fermés
      const applyClosedDaysStyle = () => {
        // Nettoyer les classes existantes
        document.querySelectorAll('.fc-day-closed').forEach(el => {
          el.classList.remove('fc-day-closed');
        });
        
        // Vue mois
        if (calendar.view.type === 'dayGridMonth') {
          document.querySelectorAll('.fc-daygrid-day').forEach(dayEl => {
            const dateAttr = dayEl.getAttribute('data-date');
            if (dateAttr) {
              const date = new Date(dateAttr);
              const dayOfWeek = date.getDay();
              if (closedDays.includes(dayOfWeek)) {
                dayEl.classList.add('fc-day-closed');
              }
            }
          });
        } 
        // Vue semaine ou jour
        else if (calendar.view.type.includes('timeGrid')) {
          // Pour chaque colonne de jour
          document.querySelectorAll('.fc-col-header-cell').forEach((headerEl) => {
            const dateAttr = headerEl.getAttribute('data-date');
            if (dateAttr) {
              const date = new Date(dateAttr);
              const dayOfWeek = date.getDay();
              
              if (closedDays.includes(dayOfWeek)) {
                // Marquer l'en-tête du jour
                headerEl.classList.add('fc-day-closed');
                
                // Trouver et marquer la colonne correspondante
                const headerIndex = Array.from(headerEl.parentElement.children).indexOf(headerEl);
                const columns = document.querySelectorAll('.fc-timegrid-col');
                if (columns[headerIndex]) {
                  columns[headerIndex].classList.add('fc-day-closed');
                }
              }
            }
          });
          
          // S'assurer que les tranches de 15 minutes sont bien visibles
          document.querySelectorAll('.fc-timegrid-slot-minor').forEach(slot => {
            (slot as HTMLElement).style.borderTop = '1px dashed #e2e8f0';
          });
        }
        
        // Supprimer les petits carrés verts indésirables
        document.querySelectorAll('.fc-daygrid-event-dot').forEach(dot => {
          dot.remove();
        });
      };
      
      calendar.render();
      calendarInstanceRef.current = calendar;
      
      // Appliquer les styles après le rendu initial
      setTimeout(() => {
        applyClosedDaysStyle();
      }, 200);
      
      return () => {
        calendar.destroy();
        calendarInstanceRef.current = null;
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [appointments, view, onEventClick, onDateSelect, availability]);

  // Mettre à jour la vue lorsque la prop view change
  useEffect(() => {
    if (calendarInstanceRef.current) {
      const viewMap = {
        month: 'dayGridMonth',
        week: 'timeGridWeek',
        day: 'timeGridDay'
      };
      calendarInstanceRef.current.changeView(viewMap[view]);
    }
  }, [view]);

  return (
    <div className="space-y-4">
      {showAvailabilityAlert && (
        <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-300">
          <Info className="h-4 w-4" />
          <AlertTitle>Configuration des horaires manquante</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>Vous n'avez pas encore configuré vos horaires de travail. Rendez-vous sur votre profil, onglet "Horaires".</span>
            <Button 
              variant="outline"
              className="text-xs"
              onClick={() => router.push('/mon-profil')}
            >
              Aller au profil
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div ref={calendarRef} className="min-h-[900px]" /> {/* Hauteur minimale augmentée */}
    </div>
  );
}