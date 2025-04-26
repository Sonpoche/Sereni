// src/app/(public)/professionnels/[id]/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, Euro, User, Phone, Mail, Info, CreditCard, CheckCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { ProfessionalType, professionalTypeLabels } from "@/types/professional"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Importer dynamiquement le formulaire de réservation
const ReservationForm = dynamic(() => import("@/components/reservation/reservation-form"), {
  ssr: false,
  loading: () => <div>Chargement du formulaire...</div>
})

// Fonction utilitaire pour éviter l'erreur undefined
const getProfessionName = (type: string | undefined): string => {
  if (!type || !professionalTypeLabels[type as ProfessionalType]) {
    return "ce professionnel";
  }
  return professionalTypeLabels[type as ProfessionalType].toLowerCase();
};

export default function ProfessionalProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [professional, setProfessional] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [activeTab, setActiveTab] = useState("essentiel")
  
  useEffect(() => {
    if (!params?.id) return
  
    const loadProfessional = async () => {
      try {
        const response = await fetch(`/api/professionnels/${params.id}`)
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données du professionnel")
        }
        
        const data = await response.json()
        setProfessional(data)
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement du profil")
        router.push("/recherche")
      } finally {
        setLoading(false)
      }
    }
    
    loadProfessional()
  }, [params?.id, router])
  
  const handleReservation = (service: any) => {
    setSelectedService(service)
    setShowReservationForm(true)
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  if (!professional) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-medium mb-4">Professionnel non trouvé</h1>
        <p className="mb-6">Le professionnel que vous recherchez n'existe pas ou n'est plus disponible.</p>
        <Button onClick={() => router.push("/recherche")}>
          Retour à la recherche
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-slate-100 min-h-screen">
      {/* Bannière avec nom et spécialité */}
      <div className="bg-slate-700 text-white py-6">
        <div className="container mx-auto px-4 flex items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{professional.user.name}</h1>
            <p className="text-slate-200">{professionalTypeLabels[professional.type as ProfessionalType] || professional.type}</p>
          </div>
          {/* Photo du professionnel à droite pour écrans plus grands */}
          <div className="hidden md:block">
            {professional.imageUrl ? (
              <img 
                src={professional.imageUrl} 
                alt={professional.user.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation et contenu des onglets */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="essentiel" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 h-auto">
              <TabsTrigger value="essentiel" className="py-2">L'essentiel</TabsTrigger>
              <TabsTrigger value="carte" className="py-2">Carte</TabsTrigger>
              <TabsTrigger value="presentation" className="py-2">Présentation</TabsTrigger>
              <TabsTrigger value="horaires" className="py-2">Horaires</TabsTrigger>
              <TabsTrigger value="tarifs" className="py-2">Tarifs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="md:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Onglet Essentiel */}
              <TabsContent value="essentiel" className="mt-0 space-y-6">
                {/* Tarifs et remboursements */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <Euro className="mr-3 h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Tarifs et remboursement</h3>
                        <p className="text-sm text-slate-600 mb-1">Carte Vitale non acceptée</p>
                        <a href="#tarifs" className="text-primary text-sm hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab("tarifs"); }}>
                          Voir les tarifs
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expertises et actes */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <User className="mr-3 h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-medium mb-3">Expertises et actes</h3>
                        <div className="flex flex-wrap gap-2">
                          {professional.services && professional.services.map((service: any) => (
                            <Badge key={service.id} variant="outline" className="bg-slate-100 text-slate-700">
                              {service.name}
                            </Badge>
                          ))}
                          {(!professional.services || professional.services.length === 0) && (
                            <p className="text-sm text-slate-500">Aucun service disponible</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carte et informations d'accès */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <MapPin className="mr-3 h-5 w-5 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-2">Carte et informations d'accès</h3>
                        <p className="font-medium">{professional.address}</p>
                        <p className="text-slate-600">{professional.postalCode} {professional.city}</p>
                        
                        <div className="mt-4 text-sm text-slate-600 space-y-1">
                          <h4 className="font-medium text-slate-700">Informations pratiques</h4>
                          <p>Rez-de-chaussée</p>
                          <p>Entrée accessible</p>
                          <p>Parking gratuit</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Carte */}
              <TabsContent value="carte" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Carte</h3>
                    <div className="bg-slate-100 rounded-md h-56 flex items-center justify-center">
                      <p className="text-slate-500">Carte non disponible</p>
                    </div>
                    
                    <div className="mt-4">
                      <p className="font-medium">{professional.address}</p>
                      <p className="text-slate-600">{professional.postalCode} {professional.city}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Présentation */}
              <TabsContent value="presentation" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Présentation</h3>
                    <div className="prose max-w-none">
                      <p className="text-slate-700 mb-4">
                        {professional.bio || 
                        `${professional.type && professionalTypeLabels[professional.type as ProfessionalType] ? professionalTypeLabels[professional.type as ProfessionalType] : "Professionnel"} spécialisé(e) dans l'accompagnement personnalisé. À l'écoute de vos besoins pour vous aider à retrouver bien-être et équilibre au quotidien.`}
                      </p>
                      
                      {professional.description && (
                        <div className="mt-6">
                          <h4 className="text-md font-medium mb-2">Mon approche</h4>
                          <p className="text-slate-700">{professional.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Horaires */}
              <TabsContent value="horaires" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Horaires et coordonnées</h3>
                    
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3">Horaires d'ouverture</h4>
                      <div className="border-t">
                        {professional.availability && professional.availability.length > 0 ? (
                          professional.availability.map((slot: any, index: number) => {
                            // Convertir le chiffre du jour en nom
                            const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
                            const dayName = days[slot.dayOfWeek];
                            
                            return (
                              <div key={index} className="py-2 border-b flex justify-between">
                                <span className="font-medium">{dayName}</span>
                                <span>{slot.startTime} - {slot.endTime}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-2 border-b flex justify-between">
                            <span className="font-medium">Horaires non disponibles</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-3">Contact d'urgence</h4>
                      <p className="text-sm text-slate-600">En cas d'urgence, contactez le 15 (Samu)</p>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-3">Visites à domicile</h4>
                      <p className="text-sm text-slate-600">
                        {professional.homeVisits ? "Oui" : "Non"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Tarifs */}
              <TabsContent value="tarifs" className="mt-0" id="tarifs">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Tarifs</h3>
                    
                    <div className="space-y-4">
                      {professional.services && professional.services.length > 0 ? (
                        professional.services.map((service: any) => (
                          <div key={service.id} className="flex justify-between py-3 border-b">
                            <div className="flex-1">
                              <h4 className="font-medium">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                              )}
                              {service.duration && (
                                <div className="text-sm text-slate-500 mt-1 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{service.duration} min</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-lg">
                                {formatPrice ? formatPrice(service.price) : service.price}€
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">Aucun tarif disponible</p>
                      )}
                    </div>
                    
                    <div className="mt-6 p-4 bg-slate-50 rounded-md text-sm text-slate-600">
                      <p className="mb-2">
                        <strong>IMPORTANT :</strong> Les actes de {getProfessionName(professional.type)} ne sont pas remboursés par la sécurité sociale. La prise en charge en {getProfessionName(professional.type)} nécessite une prescription médicale.
                      </p>
                      <p>
                        Ces honoraires vous sont communiqués à titre indicatif par le praticien. Ce montant varie selon le type de soins finalement réalisés en cabinet, le nombre de consultations et les actes additionnels nécessaires. En cas de dépassement des tarifs, le praticien doit en avertir préalablement le patient.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar (1/3) - Toujours visible */}
          <div className="md:col-span-1">
            <div className="space-y-4 sticky top-6">
              {/* Résumé et photo sur mobile */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-primary text-white p-4">
                    <h3 className="font-medium">En résumé</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Accepte les nouveaux patients sur Doctolib</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{professional.address}</p>
                      <p className="text-sm text-slate-600">{professional.postalCode} {professional.city}</p>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => setShowReservationForm(true)}
                    >
                      Prendre rendez-vous
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Moyens de paiement */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <CreditCard className="h-4 w-4 text-slate-500 mr-2" />
                    <h3 className="font-medium">Moyens de paiement</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Carte bancaire non acceptée</p>
                    <p>Chèques et espèces</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulaire de réservation */}
      {showReservationForm && (
        <ReservationForm 
          professional={professional}
          preselectedService={selectedService}
          isOpen={showReservationForm}
          onClose={() => setShowReservationForm(false)}
        />
      )}
    </div>
  )
}