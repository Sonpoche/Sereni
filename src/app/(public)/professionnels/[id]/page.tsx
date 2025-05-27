// src/app/(public)/professionnels/[id]/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, Euro, User, Phone, Mail, Info, CreditCard, CheckCircle, ChevronDown } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { ProfessionalType, professionalTypeLabels, getProfessionalTypeLabel } from "@/types/professional"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import Link from "next/link"

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
    <div className="bg-slate-50 min-h-screen">
      {/* Navigation rapide */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-3 gap-6">
            <a href="#presentation" className="text-sm font-medium whitespace-nowrap hover:text-primary">
              Présentation
            </a>
            <a href="#tarifs" className="text-sm font-medium whitespace-nowrap hover:text-primary">
              Tarifs et remboursement
            </a>
            <a href="#expertises" className="text-sm font-medium whitespace-nowrap hover:text-primary">
              Expertises et actes
            </a>
            <a href="#horaires" className="text-sm font-medium whitespace-nowrap hover:text-primary">
              Horaires
            </a>
            <a href="#acces" className="text-sm font-medium whitespace-nowrap hover:text-primary">
              Accès et contact
            </a>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="md:col-span-2 space-y-8">
            {/* Section Présentation */}
            <section id="presentation" className="scroll-mt-16">
              <h2 className="text-2xl font-medium mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Présentation
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    <h3 className="text-xl font-medium mb-4">{professional.user.name}</h3>
                    <p className="text-slate-700 mb-6">
                      {professional.bio || 
                      `${professional.type && professionalTypeLabels[professional.type as ProfessionalType] ? professionalTypeLabels[professional.type as ProfessionalType] : "Professionnel"} spécialisé(e) dans l'accompagnement personnalisé. À l'écoute de vos besoins pour vous aider à retrouver bien-être et équilibre au quotidien.`}
                    </p>
                    
                    {professional.description && (
                      <div className="mt-6">
                        <h4 className="text-lg font-medium mb-2">Mon approche</h4>
                        <p className="text-slate-700">{professional.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section Tarifs et remboursement */}
            <section id="tarifs" className="scroll-mt-16">
              <h2 className="text-2xl font-medium mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                Tarifs et remboursement
              </h2>
              <Card>
                <CardContent className="p-6">
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
                          <div className="text-right flex flex-col items-end">
                            <span className="font-bold text-lg">
                              {formatPrice ? formatPrice(service.price) : service.price}€
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => handleReservation(service)}
                            >
                              Réserver
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500">Aucun tarif disponible</p>
                    )}
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-50 rounded-md text-sm text-slate-600">
                    <p className="mb-2">
                      <strong>IMPORTANT :</strong> Les actes de {getProfessionName(professional.type)} ne sont pas remboursés par la sécurité sociale.
                    </p>
                    <p>
                      Ces honoraires vous sont communiqués à titre indicatif par le praticien. Ce montant varie selon le type de soins finalement réalisés en cabinet, le nombre de consultations et les actes additionnels nécessaires. En cas de dépassement des tarifs, le praticien doit en avertir préalablement le patient.
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-600">Carte Vitale non acceptée</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section Expertises et actes */}
            <section id="expertises" className="scroll-mt-16">
              <h2 className="text-2xl font-medium mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Expertises et actes
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {professional.services && professional.services.map((service: any) => (
                      <Badge key={service.id} variant="outline" className="bg-slate-100 text-slate-700">
                        {service.name}
                      </Badge>
                    ))}
                    {(!professional.services || professional.services.length === 0) && (
                      <p className="text-sm text-slate-500">Aucun service disponible</p>
                    )}
                  </div>

                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Spécialités</h3>
                      <div className="flex flex-wrap gap-2">
                        {professional.specialties.map((specialty: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-slate-100 text-slate-700">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {professional.certifications && professional.certifications.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {professional.certifications.map((certification: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-slate-100 text-slate-700">
                            {certification}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Section Horaires */}
            <section id="horaires" className="scroll-mt-16">
              <h2 className="text-2xl font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horaires
              </h2>
              <Card>
                <CardContent className="p-6">
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
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Visites à domicile</h3>
                    <p className="text-slate-600">
                      {professional.homeVisits ? "Oui" : "Non"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section Carte et informations d'accès */}
            <section id="acces" className="scroll-mt-16">
              <h2 className="text-2xl font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Accès et contact
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6">
                    {professional.latitude && professional.longitude ? (
                      <div className="bg-slate-100 rounded-md h-56 mb-4">
                        {/* Intégration de carte à implémenter */}
                        <div className="h-full flex items-center justify-center">
                          <p>Carte en cours de chargement</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-md h-56 flex items-center justify-center mb-4">
                        <p className="text-slate-500">Carte non disponible</p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Adresse</h3>
                      <p className="font-medium">{professional.address}</p>
                      <p className="text-slate-600">{professional.postalCode} {professional.city}</p>
                    </div>
                    
                    <div className="mt-4 text-sm text-slate-600 space-y-1">
                      <h4 className="font-medium text-slate-700 mb-2">Informations pratiques</h4>
                      <p className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>
                        Rez-de-chaussée
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>
                        Entrée accessible
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>
                        Parking gratuit
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Contact</h3>
                    {professional.phone && (
                      <p className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${professional.phone}`} className="text-primary hover:underline">
                          {professional.phone}
                        </a>
                      </p>
                    )}
                    {professional.user?.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <a href={`mailto:${professional.user.email}`} className="text-primary hover:underline">
                          {professional.user.email}
                        </a>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar (1/3) - Toujours visible */}
          <div className="md:col-span-1">
            <div className="space-y-4 sticky top-20">
              {/* Profil du professionnel */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-lavender-light p-4 text-lavender-dark">
                    <h1 className="text-xl font-medium">{professional.user.name}</h1>
                    <p className="text-lavender-dark/90 text-sm">
                      {getProfessionalTypeLabel(professional.type)}
                    </p>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    {professional.imageUrl ? (
                      <img 
                        src={professional.imageUrl} 
                        alt={professional.user.name} 
                        className="w-16 h-16 rounded-full object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">Exerce depuis {professional.yearsExperience || "plusieurs"} an{(professional.yearsExperience === 1) ? "" : "s"}</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2">
                    <Button 
                      className="w-full bg-lavender hover:bg-lavender/90 text-white border-none"
                      onClick={() => setShowReservationForm(true)}
                    >
                      Prendre rendez-vous
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* En résumé */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-4 w-4 text-lavender mr-2" />
                    <h3 className="font-medium text-lavender-dark">En résumé</h3>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{professional.address}</p>
                        <p className="text-slate-600">{professional.postalCode} {professional.city}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Moyens de paiement</p>
                        <p className="text-slate-600">Carte bancaire non acceptée</p>
                        <p className="text-slate-600">Chèques et espèces</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Services populaires */}
              {professional.services && professional.services.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 text-lavender-dark">Services populaires</h3>
                    <div className="space-y-3">
                      {professional.services.slice(0, 3).map((service: any) => (
                        <div key={service.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-slate-500">{service.duration} min</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-lavender-light text-lavender hover:bg-lavender-light/50"
                            onClick={() => handleReservation(service)}
                          >
                            {formatPrice ? formatPrice(service.price) : service.price}€
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2">
                        <a href="#tarifs" className="text-lavender text-sm hover:underline">
                          Voir tous les services
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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