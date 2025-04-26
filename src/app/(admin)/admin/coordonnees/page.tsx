// src/app/(admin)/admin/coordonnees/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { geocodeAddress } from "@/lib/utils/geocoding"
import { toast } from "sonner"
import { UserRole } from "@prisma/client"

export default function AdminCoordonnees() {
  const { data: session, status } = useSession()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState("")
  const [coords, setCoords] = useState<{ latitude: number, longitude: number } | null>(null)
  
  // Vérifier l'authentification
  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role !== UserRole.ADMIN) {
        window.location.href = "/"
        return
      }
      
      fetchProfessionals()
    } else if (status === "unauthenticated") {
      window.location.href = "/connexion"
    }
  }, [status, session])
  
  // Charger tous les professionnels
  const fetchProfessionals = async () => {
    try {
      const response = await fetch("/api/recherche/professionnels?debug=true&lat=43.5967553&lng=5.9604243")
      if (!response.ok) throw new Error("Erreur lors du chargement des données")
      
      const data = await response.json()
      setProfessionals(data.professionals || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des professionnels")
    } finally {
      setLoading(false)
    }
  }
  
  // Tester le géocodage d'une adresse
  const handleGeocode = async () => {
    if (!address) {
      toast.error("Veuillez entrer une adresse")
      return
    }
    
    try {
      setLoading(true)
      const coordonnees = await geocodeAddress(address)
      setCoords(coordonnees)
      
      if (!coordonnees) {
        toast.error("Impossible de géocoder cette adresse")
      } else {
        toast.success("Adresse géocodée avec succès")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du géocodage")
    } finally {
      setLoading(false)
    }
  }
  
  // Mettre à jour les coordonnées d'un professionnel
  const updateProfessionalCoords = async (professionalId: string, userId: string) => {
    if (!coords) return
    
    try {
      const response = await fetch(`/api/admin/professionnels/${professionalId}/coordonnees`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          userId
        }),
      })
      
      if (!response.ok) throw new Error("Erreur lors de la mise à jour")
      
      toast.success("Coordonnées mises à jour avec succès")
      fetchProfessionals()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour des coordonnées")
    }
  }
  
  if (loading && status !== "loading") {
    return <div className="flex justify-center p-8">Chargement...</div>
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnostic des coordonnées</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test de géocodage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Entrez une adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGeocode} disabled={loading}>
              Géocoder
            </Button>
          </div>
          
          {coords && (
            <div className="p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">Résultat:</h3>
              <p>Latitude: {coords.latitude}</p>
              <p>Longitude: {coords.longitude}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des professionnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nom</th>
                  <th className="text-left p-2">Ville</th>
                  <th className="text-left p-2">Code postal</th>
                  <th className="text-left p-2">Coordonnées</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((pro) => (
                  <tr key={pro.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{pro.name}</td>
                    <td className="p-2">{pro.city}</td>
                    <td className="p-2">{pro.postalCode}</td>
                    <td className="p-2">
                      {pro.hasCoordinates ? (
                        <span className="text-green-600">
                          {pro.latitude.toFixed(6)}, {pro.longitude.toFixed(6)}
                        </span>
                      ) : (
                        <span className="text-red-600">Non défini</span>
                      )}
                    </td>
                    <td className="p-2">
                      {coords && (
                        <Button 
                          size="sm" 
                          onClick={() => updateProfessionalCoords(pro.id, pro.userId)}
                          disabled={!coords}
                        >
                          Appliquer coordonnées
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}