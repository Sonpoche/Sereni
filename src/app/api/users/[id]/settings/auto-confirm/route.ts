// src/app/api/users/[id]/settings/auto-confirm/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour la mise à jour du paramètre
const autoConfirmSchema = z.object({
  autoConfirmBookings: z.boolean()
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
    const validatedData = autoConfirmSchema.parse(body)
    
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
    
    // Mettre à jour le paramètre
    const updatedProfessional = await prisma.professional.update({
      where: { id: professional.id },
      data: {
        autoConfirmBookings: validatedData.autoConfirmBookings
      }
    })
    
    return NextResponse.json({
      autoConfirmBookings: updatedProfessional.autoConfirmBookings
    })
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/settings/auto-confirm:", error)
    
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