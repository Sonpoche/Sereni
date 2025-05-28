// src/components/group-classes/registration-success-client.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Mail, 
  Phone,
  Download,
  ArrowLeft,
  Wifi
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"

interface RegistrationSuccessClientProps {
  groupClass: any
  sessionId: string
  userId: string
}

export default function RegistrationSuccessClient({
  groupClass,
  sessionId,
  userId
}: RegistrationSuccessClientProps) {
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegistrationDetails = async () => {
      try {
        // Ici on récupérerait les détails de l'inscription via l'API
        // Pour l'instant, on simule les données
        const response = await fetch(`/api/stripe/session/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setRegistration(data)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des détails:", error)
        toast.error("Erreur lors du chargement des détails")
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrationDetails()
  }, [sessionId])

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/inscriptions/${sessionId}/recu`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `recu-inscription-${groupClass.name}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      toast.error("Erreur lors du téléchargement du reçu")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
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

      {/* Message de confirmation */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription confirmée !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre inscription au cours "{groupClass.name}" a été confirmée. 
              Vous recevrez un email de confirmation dans quelques minutes.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleDownloadReceipt} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le reçu
              </Button>
              <Link href="/mes-rendez-vous">
                <Button>
                  Voir mes inscriptions
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails du cours */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Détails de votre inscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{groupClass.name}</h3>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">{groupClass.category}</Badge>
              <Badge variant="outline">{groupClass.level}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Date</div>
                <div className="text-gray-600">
                  {/* Ici on utiliserait les vraies données de la session */}
                  À définir selon la session
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Horaire</div>
                <div className="text-gray-600">
                  {groupClass.duration} minutes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {groupClass.isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Cours en ligne</div>
                    <div className="text-gray-600">Lien envoyé par email</div>
                  </div>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Lieu</div>
                    <div className="text-gray-600">
                      {groupClass.address}, {groupClass.city}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {groupClass.professional.user.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium">Praticien</div>
                <div className="text-gray-600">
                  {groupClass.professional.user.name}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Card>
        <CardHeader>
          <CardTitle>Informations importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">
                  Email de confirmation
                </div>
                <p className="text-blue-700">
                  Vous recevrez un email avec tous les détails de votre inscription, 
                  y compris {groupClass.isOnline ? "le lien de connexion" : "l'adresse exacte"}.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-900 mb-1">
                  Politique d'annulation
                </div>
                <p className="text-amber-700">
                  Vous pouvez annuler votre inscription jusqu'à 24h avant le cours 
                  pour un remboursement complet.
                </p>
              </div>
            </div>
          </div>

          {groupClass.equipment && groupClass.equipment.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-gray-900 mb-2">
                  Matériel à prévoir
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupClass.equipment.map((item: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}