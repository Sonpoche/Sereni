// src/app/(dashboard)/profil/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { UserRole } from "@prisma/client"

// Composants d'onglets de profil
import PersonalInfoTab from "@/components/profile/personal-info-tab"
import ProfessionalInfoTab from "@/components/profile/professional-info-tab"
import ServicesTab from "@/components/profile/services-tab"
import ScheduleTab from "@/components/profile/schedule-tab"
import ProfilePreview from "@/components/profile/profile-preview"
import ClientView from "@/components/profile/client-view"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirection si non authentifié
    if (status === "unauthenticated") {
      router.push("/connexion")
      return
    }

    // Récupération des données du profil de l'utilisateur connecté
    const fetchProfileData = async () => {
      if (status === "authenticated" && session.user.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}/profile`)
          if (!response.ok) throw new Error("Erreur lors du chargement du profil")
          
          const profileResponse = await response.json()
          
          // Récupérer les services (si professionnel)
          let services = [];
          if (session.user.role === UserRole.PROFESSIONAL) {
            const servicesResponse = await fetch(`/api/users/${session.user.id}/services`)
            if (servicesResponse.ok) {
              services = await servicesResponse.json()
            }
          }
          
          // Récupérer les disponibilités (si professionnel)
          let availabilityData = { timeSlots: [], autoConfirmBookings: false };
          if (session.user.role === UserRole.PROFESSIONAL) {
            const availabilityResponse = await fetch(`/api/users/${session.user.id}/availability`)
            if (availabilityResponse.ok) {
              availabilityData = await availabilityResponse.json()
            }
          }
          
          // Combiner les données
          setProfileData({
            ...profileResponse,
            services,
            availability: availabilityData.timeSlots
          })
        } catch (error) {
          console.error("Erreur:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (status === "authenticated") {
      fetchProfileData()
    } else if (status !== "loading") {
      setLoading(false)
    }
  }, [session, status, router])

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si l'utilisateur est un client, afficher uniquement les infos personnelles
  if (session?.user?.role === UserRole.CLIENT) {
    return <ClientView profileData={profileData} />
  }

  // Interface pour les professionnels avec onglets
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-title font-medium mb-8">Mon profil professionnel</h1>
      
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="personal">Informations personnelles</TabsTrigger>
          <TabsTrigger value="professional">Profil professionnel</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="schedule">Horaires</TabsTrigger>
          <TabsTrigger value="preview">Aperçu client</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <PersonalInfoTab profileData={profileData} setProfileData={setProfileData} />
        </TabsContent>
        
        <TabsContent value="professional">
          <ProfessionalInfoTab profileData={profileData} setProfileData={setProfileData} />
        </TabsContent>
        
        <TabsContent value="services">
          <ServicesTab profileData={profileData} />
        </TabsContent>
        
        <TabsContent value="schedule">
          <ScheduleTab profileData={profileData} />
        </TabsContent>
        
        <TabsContent value="preview">
          <ProfilePreview profileData={profileData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}