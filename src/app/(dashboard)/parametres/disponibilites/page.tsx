// src/app/(dashboard)/parametres/disponibilites/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  CheckCircle,
  Coffee,
  X
} from "lucide-react"

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  isActive: boolean
  slots: TimeSlot[]
}

interface WeekSchedule {
  [key: string]: DaySchedule
}

interface Exception {
  id: string
  date: string
  type: 'closed' | 'custom'
  reason?: string
  customSlots?: TimeSlot[]
}

const daysOfWeek = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
]

// Données mockées
const mockSchedule: WeekSchedule = {
  monday: {
    isActive: true,
    slots: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ]
  },
  tuesday: {
    isActive: true,
    slots: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ]
  },
  wednesday: {
    isActive: true,
    slots: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ]
  },
  thursday: {
    isActive: true,
    slots: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ]
  },
  friday: {
    isActive: true,
    slots: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ]
  },
  saturday: {
    isActive: true,
    slots: [
      { start: '10:00', end: '16:00' }
    ]
  },
  sunday: {
    isActive: false,
    slots: []
  }
}

const mockExceptions: Exception[] = [
  {
    id: '1',
    date: '2024-08-15',
    type: 'closed',
    reason: 'Vacances d\'été'
  },
  {
    id: '2',
    date: '2024-07-25',
    type: 'custom',
    reason: 'Horaires exceptionnels',
    customSlots: [{ start: '14:00', end: '16:00' }]
  }
]

export default function DisponibilitesPage() {
  const [schedule, setSchedule] = useState<WeekSchedule>(mockSchedule)
  const [exceptions, setExceptions] = useState<Exception[]>(mockExceptions)
  const [newException, setNewException] = useState<Partial<Exception>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Paramètres généraux
  const [appointmentDuration, setAppointmentDuration] = useState(60)
  const [bufferTime, setBufferTime] = useState(15)
  const [advanceBooking, setAdvanceBooking] = useState(30)
  const [minNotice, setMinNotice] = useState(24)

  const updateDayActive = (day: string, isActive: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive,
        slots: isActive ? prev[day].slots : []
      }
    }))
  }

  const addTimeSlot = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: '09:00', end: '17:00' }]
      }
    }))
  }

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const removeTimeSlot = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index)
      }
    }))
  }

  const addException = () => {
    if (!newException.date || !newException.type) return

    const exception: Exception = {
      id: Date.now().toString(),
      date: newException.date,
      type: newException.type,
      reason: newException.reason,
      customSlots: newException.type === 'custom' ? newException.customSlots : undefined
    }

    setExceptions(prev => [...prev, exception])
    setNewException({})
  }

  const removeException = (id: string) => {
    setExceptions(prev => prev.filter(e => e.id !== id))
  }

  const copySchedule = (fromDay: string, toDay: string) => {
    setSchedule(prev => ({
      ...prev,
      [toDay]: {
        ...prev[fromDay]
      }
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      const data = {
        schedule,
        exceptions,
        settings: {
          appointmentDuration,
          bufferTime,
          advanceBooking,
          minNotice
        }
      }

      const response = await fetch('/api/user/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(time)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Gestion des disponibilités
        </h1>
        <p className="text-gray-600 mt-2">
          Configurez vos horaires de travail et vos exceptions
        </p>
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Disponibilités mises à jour avec succès !
          </AlertDescription>
        </Alert>
      )}

      {/* Paramètres généraux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Paramètres généraux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointmentDuration">Durée par défaut des rendez-vous (minutes)</Label>
              <Select value={appointmentDuration.toString()} onValueChange={(value) => setAppointmentDuration(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bufferTime">Temps de pause entre rendez-vous (minutes)</Label>
              <Select value={bufferTime.toString()} onValueChange={(value) => setBufferTime(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucun</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="advanceBooking">Réservation possible jusqu'à (jours à l'avance)</Label>
              <Select value={advanceBooking.toString()} onValueChange={(value) => setAdvanceBooking(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">1 semaine</SelectItem>
                  <SelectItem value="14">2 semaines</SelectItem>
                  <SelectItem value="30">1 mois</SelectItem>
                  <SelectItem value="60">2 mois</SelectItem>
                  <SelectItem value="90">3 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minNotice">Préavis minimum (heures)</Label>
              <Select value={minNotice.toString()} onValueChange={(value) => setMinNotice(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 heures</SelectItem>
                  <SelectItem value="4">4 heures</SelectItem>
                  <SelectItem value="12">12 heures</SelectItem>
                  <SelectItem value="24">24 heures</SelectItem>
                  <SelectItem value="48">48 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horaires hebdomadaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Horaires hebdomadaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {daysOfWeek.map((day) => (
            <div key={day.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={schedule[day.key]?.isActive || false}
                    onCheckedChange={(checked) => updateDayActive(day.key, checked)}
                  />
                  <Label className="font-medium">{day.label}</Label>
                </div>
                
                {schedule[day.key]?.isActive && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(day.key)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter créneau
                    </Button>
                    
                    {/* Menu de copie d'horaires */}
                    <Select onValueChange={(value) => copySchedule(day.key, value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Copier vers..." />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek
                          .filter(d => d.key !== day.key)
                          .map(targetDay => (
                            <SelectItem key={targetDay.key} value={targetDay.key}>
                              {targetDay.label}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {schedule[day.key]?.isActive && (
                <div className="ml-8 space-y-2">
                  {schedule[day.key].slots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Select
                        value={slot.start}
                        onValueChange={(value) => updateTimeSlot(day.key, index, 'start', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <span>à</span>
                      
                      <Select
                        value={slot.end}
                        onValueChange={(value) => updateTimeSlot(day.key, index, 'end', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(day.key, index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {schedule[day.key].slots.length === 0 && (
                    <p className="text-sm text-gray-500 ml-4">
                      Aucun créneau défini
                    </p>
                  )}
                </div>
              )}

              {!schedule[day.key]?.isActive && (
                <div className="ml-8">
                  <Badge variant="secondary">Fermé</Badge>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Exceptions et congés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coffee className="h-5 w-5 mr-2" />
            Exceptions et congés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ajouter une exception */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Ajouter une exception</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="exceptionDate">Date</Label>
                <Input
                  id="exceptionDate"
                  type="date"
                  value={newException.date || ''}
                  onChange={(e) => setNewException(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="exceptionType">Type</Label>
                <Select
                  value={newException.type || ''}
                  onValueChange={(value: 'closed' | 'custom') => 
                    setNewException(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Fermé</SelectItem>
                    <SelectItem value="custom">Horaires exceptionnels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="exceptionReason">Raison</Label>
                <Input
                  id="exceptionReason"
                  placeholder="Vacances, formation..."
                  value={newException.reason || ''}
                  onChange={(e) => setNewException(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={addException} disabled={!newException.date || !newException.type}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* Liste des exceptions */}
          <div className="space-y-3">
            {exceptions.length > 0 ? (
              exceptions.map((exception) => (
                <div key={exception.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={exception.type === 'closed' ? 'destructive' : 'secondary'}>
                      {exception.type === 'closed' ? 'Fermé' : 'Horaires modifiés'}
                    </Badge>
                    <span className="font-medium">
                      {new Date(exception.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {exception.reason && (
                      <span className="text-gray-600">- {exception.reason}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeException(exception.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Aucune exception définie
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Alert className="flex-1 mr-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Les modifications seront visibles immédiatement pour vos clients.
          </AlertDescription>
        </Alert>
        
        <Button onClick={handleSave} disabled={isLoading} className="min-w-32">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sauvegarde...
            </div>
          ) : (
            <div className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}