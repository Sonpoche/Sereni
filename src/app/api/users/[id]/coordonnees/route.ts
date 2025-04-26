// src/app/api/users/[id]/coordonnees/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { geocodeAddress } from "@/lib/utils/geocoding"

// Schéma de validation pour les coordonnées
const coordsSchema = z.object({
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  postalCode: z.string().min(5, "Code postal requis"),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = coordsSchema.parse(body)
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Construire l'adresse complète
    const fullAddress = `${validatedData.address}, ${validatedData.postalCode} ${validatedData.city}, France`
    
    // Géocoder l'adresse pour obtenir les coordonnées
    const coords = await geocodeAddress(fullAddress)
    
    if (!coords) {
      return NextResponse.json(
        { error: "Impossible de géocoder cette adresse" },
        { status: 400 }
      )
    }
    
    // Mettre à jour le profil avec les coordonnées
    const updatedProfessional = await prisma.professional.update({
      where: { id: professional.id },
      data: {
        address: validatedData.address,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    })
    
    return NextResponse.json({
      success: true,
      professional: {
        address: updatedProfessional.address,
        city: updatedProfessional.city,
        postalCode: updatedProfessional.postalCode,
        latitude: updatedProfessional.latitude,
        longitude: updatedProfessional.longitude,
      }
    })
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/coordonnees:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}