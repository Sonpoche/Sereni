// src/app/(dashboard)/mes-rendez-vous/page.tsx
import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarX,
  Plus
} from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Mes rendez-vous - SereniBook",
  description: "Consultez et gérez vos rendez-vous avec vos praticiens bien-être.",
}

// Types pour les rendez-vous client
interface ClientAppointment {
  id: string
  date: string
  time: string
  duration: number
  service: string
  practitioner: {
    name: string
    profession: string
    avatar?: string
    location: string
    phone: string
    email: string
  }
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  price: number
  notes?: string
  canCancel: boolean
  canReschedule: boolean
}

// Données mockées pour l'exemple
const mockAppointments: ClientAppointment[] = [
  {
    id: "1",
    date: "2024-07-25",
    time: "14:00",
    duration: 60,
    service: "Massage relaxant",
    practitioner: {
      name: "Sophie Martin",
      profession: "Massothérapeute",
      location: "123 Rue de la Paix, Paris 11ème",
      phone: "01 23 45 67 89",
      email: "sophie@massage-zenitude.fr"
    },
    status: "confirmed",
    price: 65,
    notes: "Préférence pour huiles essentielles de lavande",
    canCancel: true,
    canReschedule: true
  },
  {
    id: "2",
    date: "2024-07-28",
    time: "10:30",
    duration: 90,
    service: "Séance de coaching",
    practitioner: {
      name: "Marc Dubois",
      profession: "Coach de vie",
      location: "45 Avenue des Champs, Lyon 6ème",
      phone: "04 56 78 90 12",
      email: "marc@coaching-evolution.fr"
    },
    status: "pending",
    price: 80,
    canCancel: true,
    canReschedule: false
  },
  {
    id: "3",
    date: "2024-07-15",
    time: "16:00",
    duration: 60,
    service: "Consultation naturopathie",
    practitioner: {
      name: "Claire Leroy",
      profession: "Naturopathe",
      location: "78 Rue du Bien-être, Marseille 8ème",
      phone: "04 91 23 45 67",
      email: "claire@naturo-sante.fr"
    },
    status: "completed",
    price: 70,
    canCancel: false,
    canReschedule: false
  }
]

const getStatusConfig = (status: ClientAppointment['status']) => {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Confirmé',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      }
    case 'pending':
      return {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle
      }
    case 'cancelled':
      return {
        label: 'Annulé',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    case 'completed':
      return {
        label: 'Terminé',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle
      }
  }
}

function AppointmentCard({ appointment }: { appointment: ClientAppointment }) {
  const statusConfig = getStatusConfig(appointment.status)
  const StatusIcon = statusConfig.icon
  
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`)
  const isUpcoming = appointmentDate > new Date()
  const isPast = appointmentDate < new Date()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{appointment.service}</CardTitle>
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              {appointment.practitioner.name} • {appointment.practitioner.profession}
            </div>
          </div>
          <Badge className={`${statusConfig.color} border`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date et heure */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(appointment.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {appointment.time} ({appointment.duration} min)
          </div>
        </div>

        {/* Lieu */}
        <div className="flex items-start text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          {appointment.practitioner.location}
        </div>

        {/* Prix */}
        <div className="text-lg font-semibold text-primary">
          {appointment.price}€
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-start">
              <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-700">{appointment.notes}</span>
            </div>
          </div>
        )}

        {/* Contact praticien */}
        <div className="flex items-center space-x-4 text-sm">
          <a 
            href={`tel:${appointment.practitioner.phone}`}
            className="flex items-center text-primary hover:text-primary-dark"
          >
            <Phone className="h-4 w-4 mr-1" />
            Appeler
          </a>
          <a 
            href={`mailto:${appointment.practitioner.email}`}
            className="flex items-center text-primary hover:text-primary-dark"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </a>
        </div>

        {/* Actions */}
        {(appointment.canCancel || appointment.canReschedule) && isUpcoming && (
          <div className="flex space-x-2 pt-2 border-t">
            {appointment.canReschedule && (
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Reprogrammer
              </Button>
            )}
            {appointment.canCancel && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <CalendarX className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function MesRendezVousPage() {
  const upcomingAppointments = mockAppointments.filter(apt => {
    const aptDate = new Date(`${apt.date}T${apt.time}`)
    return aptDate > new Date() && apt.status !== 'cancelled'
  })

  const pastAppointments = mockAppointments.filter(apt => {
    const aptDate = new Date(`${apt.date}T${apt.time}`)
    return aptDate < new Date() || apt.status === 'completed'
  })

  const pendingAppointments = mockAppointments.filter(apt => apt.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-title font-bold text-gray-900">
                Mes rendez-vous
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez vos rendez-vous avec vos praticiens bien-être
              </p>
            </div>
            <Link href="/rechercher-praticien">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rendez-vous
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                  <p className="text-gray-600">À venir</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
                  <p className="text-gray-600">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{pastAppointments.length}</p>
                  <p className="text-gray-600">Terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets pour organiser les rendez-vous */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">
              À venir ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({pendingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Historique ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          {/* Rendez-vous à venir */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingAppointments.length > 0 ? (
              <div className="grid gap-6">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun rendez-vous à venir
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Prenez rendez-vous avec un praticien pour commencer votre parcours bien-être.
                  </p>
                  <Link href="/rechercher-praticien">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Trouver un praticien
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rendez-vous en attente */}
          <TabsContent value="pending" className="space-y-6">
            {pendingAppointments.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-yellow-800">
                      Ces rendez-vous sont en attente de confirmation par le praticien.
                    </p>
                  </div>
                </div>
                <div className="grid gap-6">
                  {pendingAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun rendez-vous en attente
                  </h3>
                  <p className="text-gray-600">
                    Tous vos rendez-vous ont été confirmés ou traités.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Historique des rendez-vous */}
          <TabsContent value="past" className="space-y-6">
            {pastAppointments.length > 0 ? (
              <div className="grid gap-6">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun historique
                  </h3>
                  <p className="text-gray-600">
                    Vos rendez-vous passés apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Section aide */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-lavender-light/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Besoin d'aide avec vos rendez-vous ?
                </h3>
                <p className="text-gray-600 mb-4">
                  Notre équipe support est là pour vous accompagner dans la gestion de vos rendez-vous.
                </p>
                <div className="flex space-x-4">
                  <Link href="/aide">
                    <Button variant="outline" size="sm">
                      Centre d'aide
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="sm">
                      Nous contacter
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}