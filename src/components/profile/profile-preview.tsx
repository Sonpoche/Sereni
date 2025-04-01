// src/components/profile/profile-preview.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, PhoneCall, Mail, Globe, User, Star } from "lucide-react"

// Interface pour le profil professionnel
interface ProfessionalProfile {
  id?: string;
  type?: string;
  otherTypeDetails?: string;
  yearsExperience?: number;
  bio?: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  specialties?: string[];
  certifications?: string[];
  phone?: string;
  website?: string;
}

// Interface pour un service
interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
}

// Interface pour une disponibilité
interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Interface pour les données du profil
interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  professionalProfile?: ProfessionalProfile;
  services?: Service[];
  availability?: Availability[];
}

const dayNames = [
  "Dimanche",
  "Lundi", 
  "Mardi", 
  "Mercredi", 
  "Jeudi", 
  "Vendredi", 
  "Samedi"
];

export default function ProfilePreview({ profileData }: { profileData: ProfileData }) {
  const [activeTab, setActiveTab] = useState<"info" | "services" | "availability">("info")
  
  // Formatage de l'heure pour l'affichage
  const formatTime = (time: string) => {
    return new Date(0, 0, 0, parseInt(time.split(':')[0]), parseInt(time.split(':')[1]))
      .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* En-tête du profil avec bannière et photo de profil */}
      <div className="relative mb-8">
        <div className="h-48 w-full bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg mb-16"></div>
        <div className="absolute -bottom-12 left-8 flex items-end">
          <div className="relative h-32 w-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
            {/* Image de profil */}
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <User className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          <div className="ml-4 mb-4">
            <h1 className="text-2xl font-bold">{profileData.name || "Nom du praticien"}</h1>
            <p className="text-gray-600">
              {profileData.professionalProfile?.type || "Type d'activité"} 
              {profileData.professionalProfile?.yearsExperience && 
                ` • ${profileData.professionalProfile.yearsExperience} ans d'expérience`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="flex border-b mb-6 pt-4">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "info" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("info")}
        >
          Informations
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "services" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("services")}
        >
          Services
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "availability" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("availability")}
        >
          Disponibilités
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* À propos */}
          <Card>
            <CardHeader>
              <CardTitle>À propos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">
                {profileData.professionalProfile?.bio || "Aucune biographie renseignée."}
              </p>
            </CardContent>
          </Card>

          {/* Approche */}
          <Card>
            <CardHeader>
              <CardTitle>Mon approche</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">
                {profileData.professionalProfile?.description || "Aucune description de l'approche renseignée."}
              </p>
            </CardContent>
          </Card>

          {/* Informations de contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profileData.professionalProfile?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>
                      {profileData.professionalProfile.address}, 
                      {profileData.professionalProfile.postalCode} {profileData.professionalProfile.city}
                    </span>
                  </div>
                )}
                {profileData.professionalProfile?.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-gray-500" />
                    <span>{profileData.professionalProfile.phone}</span>
                  </div>
                )}
                {profileData.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{profileData.email}</span>
                  </div>
                )}
                {profileData.professionalProfile?.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a 
                      href={profileData.professionalProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profileData.professionalProfile.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spécialités */}
          {profileData.professionalProfile?.specialties && profileData.professionalProfile.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Spécialités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.professionalProfile.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">{specialty}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {profileData.professionalProfile?.certifications && profileData.professionalProfile.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {profileData.professionalProfile.certifications.map((certification, index) => (
                    <li key={index}>{certification}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "services" && (
        <div className="space-y-6">
          {!profileData.services || profileData.services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Aucun service proposé pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileData.services.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: service.color || '#6746c3' }}
                  />
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>{service.name}</span>
                      <span className="text-xl">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(service.price))}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> 
                      {service.duration} minutes
                    </CardDescription>
                  </CardHeader>
                  {service.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </CardContent>
                  )}
                  <CardFooter className="border-t p-4">
                    <Button className="w-full">Réserver</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "availability" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disponibilités</CardTitle>
              <CardDescription>Horaires habituels d'ouverture</CardDescription>
            </CardHeader>
            <CardContent>
              {!profileData.availability || profileData.availability.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune disponibilité renseignée.</p>
              ) : (
                <div className="space-y-2">
                  {/* Grouper par jour et trier */}
                  {Array.from(new Set(profileData.availability.map(slot => slot.dayOfWeek))).sort().map(day => (
                    <div key={day} className="flex border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="w-24 font-medium">{dayNames[day]}</div>
                      <div>
                        {profileData.availability
                          ?.filter(slot => slot.dayOfWeek === day)
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((slot, index) => (
                            <span key={slot.id}>
                              {index > 0 && ", "}
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Prendre un rendez-vous</CardTitle>
              <CardDescription>Sélectionnez un service et une date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <Calendar className="h-10 w-10 mx-auto text-primary/60 mb-2" />
                <p className="text-gray-500">
                  Le calendrier de réservation s'affichera ici pour les clients.
                </p>
                <Button className="mt-4">Simuler la réservation</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Note indiquant qu'il s'agit d'un aperçu */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          <strong>Note :</strong> Ceci est un aperçu de la façon dont votre profil apparaît aux clients potentiels. 
          Les interactions (comme le bouton de réservation) ne sont pas fonctionnelles dans cette vue d'aperçu.
        </p>
      </div>
    </div>
  )
}