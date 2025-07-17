// src/components/register/steps/schedule-form.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, Info, Copy, Calendar } from "lucide-react"

interface ScheduleData {
  workingDays: number[]
  startTime: string
  endTime: string
  isFullWeek: boolean
}

interface ScheduleFormProps {
  onSubmit: (data: ScheduleData) => void
  onBack: () => void
  isLoading?: boolean
  initialData?: ScheduleData
}

const DAYS = [
  { id: 0, name: "Dimanche", short: "Dim" },
  { id: 1, name: "Lundi", short: "Lun" },
  { id: 2, name: "Mardi", short: "Mar" },
  { id: 3, name: "Mercredi", short: "Mer" },
  { id: 4, name: "Jeudi", short: "Jeu" },
  { id: 5, name: "Vendredi", short: "Ven" },
  { id: 6, name: "Samedi", short: "Sam" }
]

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00"
]

export default function ScheduleForm({ 
  onSubmit, 
  onBack, 
  isLoading = false,
  initialData 
}: ScheduleFormProps) {
  const [workingDays, setWorkingDays] = useState<number[]>(
    initialData?.workingDays || [1, 2, 3, 4, 5] // Lundi à vendredi par défaut
  )
  const [startTime, setStartTime] = useState(initialData?.startTime || "09:00")
  const [endTime, setEndTime] = useState(initialData?.endTime || "18:00")
  const [isFullWeek, setIsFullWeek] = useState(initialData?.isFullWeek || false)

  const toggleDay = (dayId: number) => {
    setWorkingDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId].sort()
    )
  }

  const selectWeekdays = () => {
    setWorkingDays([1, 2, 3, 4, 5])
    setIsFullWeek(false)
  }

  const selectFullWeek = () => {
    setWorkingDays([0, 1, 2, 3, 4, 5, 6])
    setIsFullWeek(true)
  }

  const handleSubmit = () => {
    if (workingDays.length === 0) {
      alert("Veuillez sélectionner au moins un jour de travail")
      return
    }

    if (startTime >= endTime) {
      alert("L'heure de fin doit être après l'heure de début")
      return
    }

    onSubmit({
      workingDays,
      startTime,
      endTime,
      isFullWeek
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Vos horaires de travail</h2>
        <p className="text-muted-foreground">
          Définissez vos créneaux de disponibilité. Vous pourrez les modifier plus tard dans votre profil.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Jours de travail
          </CardTitle>
          <CardDescription>
            Sélectionnez les jours où vous souhaitez recevoir des réservations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Boutons rapides */}
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={selectWeekdays}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Semaine (Lun-Ven)
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={selectFullWeek}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              7j/7
            </Button>
          </div>

          {/* Sélection des jours */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(day => (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${workingDays.includes(day.id)
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-xs font-medium">{day.short}</div>
                <div className="text-xs opacity-75">{day.name.slice(0, 3)}</div>
              </button>
            ))}
          </div>

          {workingDays.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-sm text-muted-foreground">Jours sélectionnés :</span>
              {workingDays.map(dayId => (
                <Badge key={dayId} variant="secondary" className="text-xs bg-lavender/20 text-lavender-dark border-lavender/30">
                  {DAYS.find(d => d.id === dayId)?.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires de travail
          </CardTitle>
          <CardDescription>
            Définissez votre plage horaire habituelle pour tous les jours sélectionnés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Heure de début</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.slice(0, -2).map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Heure de fin</label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.slice(2).map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Ces horaires seront appliqués à tous vos jours de travail.</p>
                <p>Vous pourrez personnaliser chaque jour individuellement plus tard dans votre profil.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || workingDays.length === 0}
          className="min-w-32"
        >
          {isLoading ? "Enregistrement..." : "Continuer"}
        </Button>
      </div>
    </div>
  )
}