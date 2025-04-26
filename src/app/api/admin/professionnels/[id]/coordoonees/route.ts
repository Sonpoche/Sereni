// src/app/api/admin/professionnels/[id]/coordonnees/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { UserRole } from "@prisma/client"

// Schéma de validation pour les coordonnées
const coordsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  userId: z.string()
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    const professionalId = params.id
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = coordsSchema.parse(body)
    
    // Mettre à jour les coordonnées du professionnel
    const updatedProfessional = await prisma.professional.update({
      where: { id: professionalId },
      data: {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
      }
    })
    
    return NextResponse.json({
      success: true,
      professional: {
        id: updatedProfessional.id,
        latitude: updatedProfessional.latitude,
        longitude: updatedProfessional.longitude,
      }
    })
  } catch (error) {
    console.error("Erreur dans PATCH /api/admin/professionnels/[id]/coordonnees:", error)
    
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