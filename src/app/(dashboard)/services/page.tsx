// src/app/(dashboard)/services/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import ServicesManager from "@/components/services/services-manager"

export default function ServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)

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
          
          const data = await response.json()
          setProfileData(data)
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
  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-title font-medium">Gestion des services</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau service
        </Button>
      </div>
      
      <ServicesManager profileData={profileData} />
    </div>
  )
}