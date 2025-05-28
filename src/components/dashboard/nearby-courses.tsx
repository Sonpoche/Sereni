// src/components/dashboard/nearby-courses.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Calendar, ArrowRight, Wifi } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

interface NearbyCourse {
  id: string
  name: string
  description: string
  price: number
  duration: number
  maxParticipants: number
  distance: number | null
  isOnline: boolean
  city: string
  professional: {
    user: { name: string, id: string }
  }
  sessions: Array<{
    id: string
    startTime: string
    registrations: { id: string }[]
  }>
  availablePlaces: number
}

export function NearbyCourses() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<NearbyCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [clientLocation, setClientLocation] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchNearbyCourses()
    }
  }, [session?.user?.id])

  const fetchNearbyCourses = async () => {
    try {
      const response = await fetch(`/api/users/${session!.user!.id}/cours-proximite`)
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        setClientLocation(data.clientLocation)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des cours:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cours collectifs à proximité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cours collectifs à proximité
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Aucun cours à proximité</h3>
          <p className="text-sm text-gray-500 mb-4">
            {clientLocation ? 
              `Aucun cours collectif trouvé dans un rayon de ${clientLocation.distance}km autour de ${clientLocation.city}` :
              "Complétez votre profil pour voir les cours à proximité"
            }
          </p>
          <Link href="/cours-collectifs">
            <Button variant="outline" size="sm">
              Voir tous les cours
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Cours collectifs à proximité
        </CardTitle>
        <Link href="/cours-collectifs">
          <Button variant="outline" size="sm">
            Voir tout
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{course.name}</h4>
                <p className="text-sm text-gray-600">
                  avec {course.professional.user.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{course.price}€</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  {course.isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      En ligne
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      {course.distance !== null ? `${course.distance}km` : course.city}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.availablePlaces} places
                </span>
              </div>
            </div>

            {course.sessions.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Prochaines séances :</p>
                <div className="flex flex-wrap gap-2">
                  {course.sessions.slice(0, 2).map((session) => (
                    <Badge key={session.id} variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(session.startTime), 'dd/MM à HH:mm', { locale: fr })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Link href={`/cours-collectifs/${course.id}`}>
              <Button size="sm" className="w-full">
                Voir les détails
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}