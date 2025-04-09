// src/components/appointments/calendar-header.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek } from "date-fns"
import { fr } from "date-fns/locale"

interface CalendarHeaderProps {
  currentDate: Date
  view: 'month' | 'week' | 'day'
  onViewChange: (view: 'month' | 'week' | 'day') => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday
}: CalendarHeaderProps) {
  
  // Formatter l'affichage de la date selon la vue
  const formatDateRange = () => {
    if (view === 'day') {
      return format(currentDate, "d MMMM yyyy", { locale: fr })
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Lundi
      const end = endOfWeek(currentDate, { weekStartsOn: 1 }) // Dimanche
      
      const sameMonth = start.getMonth() === end.getMonth()
      const sameYear = start.getFullYear() === end.getFullYear()
      
      if (sameMonth && sameYear) {
        return `${format(start, "d", { locale: fr })} - ${format(end, "d MMMM yyyy", { locale: fr })}`
      } else if (sameYear) {
        return `${format(start, "d MMM", { locale: fr })} - ${format(end, "d MMM yyyy", { locale: fr })}`
      } else {
        return `${format(start, "d MMM yyyy", { locale: fr })} - ${format(end, "d MMM yyyy", { locale: fr })}`
      }
    } else {
      return format(currentDate, "MMMM yyyy", { locale: fr })
    }
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToday}
          className="whitespace-nowrap"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Aujourd'hui
        </Button>
        <Button variant="outline" size="icon" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="text-lg font-medium ml-2 capitalize">
          {formatDateRange()}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          size="sm"
          variant={view === 'day' ? 'default' : 'outline'} 
          onClick={() => onViewChange('day')}
        >
          Jour
        </Button>
        <Button 
          size="sm"
          variant={view === 'week' ? 'default' : 'outline'} 
          onClick={() => onViewChange('week')}
        >
          Semaine
        </Button>
        <Button 
          size="sm"
          variant={view === 'month' ? 'default' : 'outline'} 
          onClick={() => onViewChange('month')}
        >
          Mois
        </Button>
      </div>
    </div>
  )
}