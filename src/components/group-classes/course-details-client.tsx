// src/components/group-classes/course-details-client.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Clock,
  Users,
  Calendar,
  Wifi,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Euro
} from "lucide-react"
import { format, formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"
import { formatServicePrice } from "@/lib/utils"
import SimpleRegistrationDialog from "./simple-registration-dialog"

// Type corrigé pour les données sérialisées
interface SerializedGroupClass {
  id: string
  name: string
  description: string | null
  price: number // Converti de Decimal à number
  duration: number
  maxParticipants: number
  professionalId: string
  category: string | null
  level: string | null
  isOnline: boolean
  city: string | null
  address: string | null
  postalCode: string | null // AJOUTÉ
  latitude: number | null // AJOUTÉ
  longitude: number | null // AJOUTÉ
  equipment: string[]
  active: boolean
  createdAt: string // Converti de Date à string
  updatedAt: string // Converti de Date à string
  professional: {
    user: {
      name: string | null
      email: string | null
    }
  }
  sessions: Array<{
    id: string
    startTime: string // Converti de Date à string
    endTime: string // Converti de Date à string
    status: string
    currentParticipants: number
    notes: string | null // AJOUTÉ
    registrations: Array<{
      id: string
      status: string // AJOUTÉ
      paymentStatus: string // AJOUTÉ
      registeredAt: string // Converti de Date à string
      client: {
        user: {
          name: string | null
        }
      }
    }>
  }>
}

interface CourseDetailsClientProps {
  groupClass: SerializedGroupClass
  currentUser?: any
}

export default function CourseDetailsClient({ 
  groupClass, 
  currentUser 
}: CourseDetailsClientProps) {
  const { data: session } = useSession()
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [userRegistrations, setUserRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Charger les inscriptions de l'utilisateur
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/inscriptions`)
        if (response.ok) {
          const data = await response.json()
          setUserRegistrations(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des inscriptions:", error)
      }
    }
    
    fetchUserRegistrations()
  }, [session?.user?.id])

  const handleRegisterClick = (sessionData: any) => {
    if (!currentUser) {
      toast.error("Vous devez vous connecter pour vous inscrire")
      return
    }
    
    setSelectedSession(sessionData)
    setIsRegistrationOpen(true)
  }

  const handleRegistrationSuccess = () => {
    setIsRegistrationOpen(false)
    setSelectedSession(null)
    toast.success("Inscription réussie ! Le praticien va être notifié.")
    // Recharger les inscriptions
    window.location.reload()
  }

  const isUserRegistered = (sessionId: string) => {
    return userRegistrations.some(reg => 
      reg.sessionId === sessionId && 
      reg.status !== 'CANCELLED'
    )
  }

  const getAvailablePlaces = (sessionData: any) => {
    return groupClass.maxParticipants - sessionData.registrations.length
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Navigation retour */}
      <div className="mb-6">
        <Link 
          href="/tableau-de-bord" 
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au tableau de bord
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête du cours */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {groupClass.isOnline ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Wifi className="h-5 w-5" />
                        <span className="text-sm font-medium">Cours en ligne</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600">
                        <MapPin className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {groupClass.city}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="text-2xl mb-3">
                    {groupClass.name}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{groupClass.category}</Badge>
                    <Badge variant="outline">{groupClass.level}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{groupClass.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Max {groupClass.maxParticipants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      <span className="font-semibold text-lg text-primary">
                        {formatServicePrice(groupClass.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Description */}
          {groupClass.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {groupClass.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Matériel requis */}
          {groupClass.equipment && groupClass.equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Matériel requis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {groupClass.equipment.map((item: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Localisation */}
          {!groupClass.isOnline && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lieu du cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">{groupClass.address}</p>
                    <p className="text-gray-600">
                      {groupClass.postalCode} {groupClass.city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Professionnel et Sessions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informations sur le professionnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Votre praticien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {(groupClass.professional.user.name || 'P').charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">
                  {groupClass.professional.user.name || 'Praticien'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Professionnel du bien-être
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sessions disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prochaines séances</CardTitle>
            </CardHeader>
            <CardContent>
              {groupClass.sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Aucune séance programmée</p>
                  <p className="text-sm text-gray-500">
                    Revenez bientôt pour de nouvelles dates !
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupClass.sessions.map((sessionData: any) => {
                    const availablePlaces = getAvailablePlaces(sessionData)
                    const isRegistered = isUserRegistered(sessionData.id)
                    const isFull = availablePlaces === 0
                    const isPast = new Date(sessionData.startTime) < new Date()
                    
                    return (
                      <div 
                        key={sessionData.id}
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {format(new Date(sessionData.startTime), 'EEEE d MMMM', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(sessionData.startTime), 'HH:mm', { locale: fr })} - 
                                {format(new Date(sessionData.endTime), 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {availablePlaces} place{availablePlaces > 1 ? 's' : ''} restante{availablePlaces > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-500">
                              sur {groupClass.maxParticipants}
                            </div>
                          </div>
                        </div>
                        
                        <Separator className="mb-3" />
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {formatDistance(new Date(sessionData.startTime), new Date(), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </div>
                          
                          {isRegistered ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Inscrit</span>
                            </div>
                          ) : isPast ? (
                            <Badge variant="secondary">Passé</Badge>
                          ) : isFull ? (
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Complet</span>
                            </div>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleRegisterClick(sessionData)}
                              disabled={loading}
                            >
                              S'inscrire
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog d'inscription simplifié */}
      {selectedSession && (
        <SimpleRegistrationDialog
          open={isRegistrationOpen}
          onOpenChange={setIsRegistrationOpen}
          session={selectedSession}
          groupClass={groupClass}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  )
}