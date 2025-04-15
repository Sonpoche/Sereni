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
  currentDate: Date
  onEventClick: (info: any) => void
  onDateSelect: (info: any) => void
  onDateNavigate?: (date: Date) => void
  availability?: any[]
  calendarRef?: React.RefObject<any>
}

export default function AppointmentCalendar({ 
  appointments, 
  view, 
  currentDate,
  onEventClick, 
  onDateSelect,
  onDateNavigate,
  availability = [],
  calendarRef
}: AppointmentCalendarProps) {
  const calendarElRef = useRef<HTMLDivElement>(null)
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
    const closedDays = []
    
    // Parcourir tous les jours (0-6)
    for (let i = 0; i < 7; i++) {
      if (!availability.some(slot => slot.dayOfWeek === i)) {
        closedDays.push(i)
      }
    }
    
    return closedDays
  }

  // Initialisation du calendrier
  useEffect(() => {
    if (calendarElRef.current) {
      const calendarEl = calendarElRef.current
      
      // Liste des jours fermés
      const closedDays = getClosedDays()
      
      // Supprimer toute balise style existante
      const oldStyle = document.getElementById('calendar-custom-style')
      if (oldStyle) {
        oldStyle.remove()
      }
      
      // Ajouter du CSS personnalisé
      const style = document.createElement('style')
      style.id = 'calendar-custom-style'
      style.innerHTML = `
        /* Style personnalisé pour le calendrier - basé sur le modèle fourni */
        .fc-theme-standard {
          font-family: 'Quicksand', sans-serif;
        }
        .fc-theme-standard .fc-view {
          background-color: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .fc .fc-timegrid-slot {
          height: 40px !important; /* Créneaux moins hauts pour éviter le défilement */
          border-bottom: 1px solid #f1f5f9;
        }
        .fc .fc-timegrid-body {
          min-height: auto !important; /* Ajustement automatique */
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
          text-transform: lowercase;
          font-size: 0.9rem;
        }
        .fc .fc-col-header-cell-cushion::first-letter {
          text-transform: uppercase;
        }
        .fc .fc-timegrid-slot-label-cushion {
          font-weight: 500;
          color: #64748b;
          margin-top: 0;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-color: #67B3AB;
          border-width: 2px;
        }
        .fc .fc-day-today {
          background-color: #e9f6f5 !important;
        }
        .fc .fc-event {
          border-radius: 4px;
          border: none;
          padding: 4px 6px; /* Plus de padding pour meilleure lisibilité */
          font-size: 0.875rem;
          margin: 2px; /* Légèrement plus de marge */
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Ombre légère pour relief */
        }
        .fc .fc-event-title {
          font-weight: 600; /* Plus gras pour meilleure lisibilité */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(0, 0, 0, 0.85); /* Texte plus foncé pour contraste */
        }
        .fc .fc-event-time {
          font-weight: 500;
          font-size: 0.8rem;
        }
        
        /* Style pour les colonnes fermées - Vue jour/semaine */
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
          font-size: 14px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
          background-color: rgba(254, 226, 226, 0.8);
          padding: 2px 10px;
          border-radius: 4px;
        }
        
        /* Styles spécifiques par statut de rendez-vous - Améliorés pour meilleure visibilité */
        .fc .fc-event.status-PENDING {
          background-color: #e9d5ff;
          border-left: 4px solid #9333ea;
          color: #5b21b6; /* Texte plus foncé */
        }
        .fc .fc-event.status-CONFIRMED {
          background-color: #d1fae5;
          border-left: 4px solid #10b981;
          color: #047857; /* Texte plus foncé */
        }
        .fc .fc-event.status-CANCELLED {
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
          color: #b91c1c; /* Texte plus foncé */
          opacity: 0.7;
        }
        .fc .fc-event.status-COMPLETED {
          background-color: #dbeafe;
          border-left: 4px solid #3b82f6;
          color: #1d4ed8; /* Texte plus foncé */
        }
        
        /* Style spécifique pour les absences système */
        .fc .fc-event.status-CANCELLED[data-system="true"] {
          background-color: #fef3c7; /* Fond jaune pâle pour les absences */
          border-left: 4px solid #f59e0b;
          color: #92400e;
          font-weight: bold;
          opacity: 0.9;
        }
        
        /* Style pour la vue mois */
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
          height: 40px !important; /* Ajusté pour correspondre à la hauteur des slots */
          display: flex !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
        }
        .appointment-content {
          padding: 2px 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Styles pour les cours collectifs */
        .fc .fc-event[data-group="true"] {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
          color: #1e40af;
        }
        .fc .fc-event[data-group="true"]::after {
          content: " 👥";
          font-size: 0.8rem;
        }
      `
      document.head.appendChild(style)
      
      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: view === 'month' ? 'dayGridMonth' : 
                    view === 'week' ? 'timeGridWeek' : 'timeGridDay',
        initialDate: currentDate,
        headerToolbar: false,
        locale: frLocale,
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00:00',
        snapDuration: '00:15:00',
        height: 'auto',
        contentHeight: view === 'week' ? 700 : 'auto', // Plus petit pour moins de défilement
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
        events: appointments.map(appointment => {
          // Déterminer si c'est une absence système
          const isSystemAbsence = appointment.status === "CANCELLED" && 
                                 (appointment.client?.user?.email === "system@serenibook.app" ||
                                  appointment.clientId === "00000000-0000-0000-0000-000000000000")
          
          return {
            id: appointment.id,
            title: isSystemAbsence ? "Absence" : appointment.client?.user?.name || 'Client',
            start: appointment.startTime,
            end: appointment.endTime,
            className: `status-${appointment.status}`,
            // Ajouter un attribut data pour les absences système
            extendedProps: {
              clientName: appointment.client?.user?.name || '',
              clientEmail: appointment.client?.user?.email || '',
              clientPhone: appointment.client?.phone || '',
              serviceName: appointment.service?.name || '',
              servicePrice: appointment.service?.price || 0,
              status: appointment.status,
              isSystemAbsence: isSystemAbsence,
              isRecurring: appointment.isRecurring || false,
              isGroupClass: appointment.isGroupClass || false,
              maxParticipants: appointment.maxParticipants || 1,
              currentParticipants: appointment.currentParticipants || 0
            }
          }
        }),
        eventContent: function(arg) {
          const clientName = arg.event.title;
          const status = arg.event.extendedProps.status;
          const isSystemAbsence = arg.event.extendedProps.isSystemAbsence;
          const isRecurring = arg.event.extendedProps.isRecurring;
          const isGroupClass = arg.event.extendedProps.isGroupClass;
          const maxParticipants = arg.event.extendedProps.maxParticipants;
          const currentParticipants = arg.event.extendedProps.currentParticipants;
          
          // Afficher uniquement l'heure de début
          const startTime = arg.event.start ? new Date(arg.event.start).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }) : '';
          
          // Déterminer la couleur du texte en fonction du statut
          let textColor = 'text-gray-900'; // Texte foncé par défaut
          
          // Vous pouvez ajuster ces couleurs en fonction de vos fonds
          if (status === 'PENDING') {
            textColor = 'text-purple-900'; // Texte foncé sur fond rose/violet
          } else if (status === 'CONFIRMED') {
            textColor = 'text-green-900'; // Texte foncé sur fond vert
          } else if (status === 'CANCELLED') {
            textColor = 'text-red-900'; // Texte foncé sur fond rouge 
          }
          
          if (isSystemAbsence) {
            return { html: `
              <div class="appointment-content">
                <div class="flex items-center">
                  <span class="font-semibold text-amber-900">${startTime}</span>
                  <span class="ml-2 text-amber-900">Absence</span>
                </div>
              </div>
            `}
          }
          
          let icons = '';
          
          if (isRecurring) {
            icons += '<svg class="h-3 w-3 ml-1 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a7 7 0 100 14 7 7 0 000-14zm0 1a6 6 0 110 12 6 6 0 010-12z"/><path d="M10 4a6 6 0 00-6 6h2a4 4 0 014-4V4z"/></svg>';
          }
          
          if (isGroupClass) {
            icons += `<span class="ml-1 text-xs">(${currentParticipants}/${maxParticipants})</span>`;
          }
          
          return { html: `
            <div class="appointment-content">
              <div class="flex items-center">
                <span class="font-semibold ${textColor}">${startTime}</span>
                <span class="ml-2 ${textColor} truncate">${clientName}${icons}</span>
              </div>
            </div>
          `}
        },

        eventDidMount: function(info) {
          if (info.event.extendedProps.isSystemAbsence) {
            info.el.setAttribute('data-system', 'true');
          }
          
          if (info.event.extendedProps.isRecurring) {
            info.el.setAttribute('data-recurring', 'true');
          }
          
          if (info.event.extendedProps.isGroupClass) {
            info.el.setAttribute('data-group', 'true');
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
          
          // Notifier le parent du changement de date
          if (onDateNavigate) {
            onDateNavigate(info.view.calendar.getDate());
          }
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
                if (headerEl.parentElement) {
                  const headerIndex = Array.from(headerEl.parentElement.children).indexOf(headerEl);
                  if (headerIndex !== -1) {
                    const columns = document.querySelectorAll('.fc-timegrid-col');
                    if (columns[headerIndex]) {
                      columns[headerIndex].classList.add('fc-day-closed');
                    }
                  }
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
      
      // Correction importante pour la référence du calendrier
      if (calendarRef && typeof calendarRef === 'object' && 'current' in calendarRef) {
        // @ts-ignore - Nécessaire pour assigner la valeur
        calendarRef.current = calendar;
      }
      
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
  }, [appointments, view, onEventClick, onDateSelect, availability, currentDate, onDateNavigate, calendarRef]);

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
  
  // Mettre à jour la date lorsque currentDate change
  useEffect(() => {
    if (calendarInstanceRef.current) {
      calendarInstanceRef.current.gotoDate(currentDate);
    }
  }, [currentDate]);

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
              onClick={() => router.push('/profil')}
            >
              Aller au profil
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div ref={calendarElRef} className="min-h-[600px]" />
    </div>
  );
}