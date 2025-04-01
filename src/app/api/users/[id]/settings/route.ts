// src/app/api/users/[id]/settings/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour les paramètres
const settingsSchema = z.object({
  bufferTime: z.number().min(0).max(120),
  autoConfirmBookings: z.boolean(),
})

export async function GET(
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
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: {
        bufferTime: true,
        autoConfirmBookings: true,
      }
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      bufferTime: professional.bufferTime || 0,
      autoConfirmBookings: professional.autoConfirmBookings || false,
    })
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/settings:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

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
    const validatedData = settingsSchema.parse(body)
    
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
    
    // Mettre à jour les paramètres
    const updatedProfessional = await prisma.professional.update({
      where: { id: professional.id },
      data: {
        bufferTime: validatedData.bufferTime,
        autoConfirmBookings: validatedData.autoConfirmBookings,
      },
      select: {
        bufferTime: true,
        autoConfirmBookings: true,
      }
    })
    
    return NextResponse.json({
      bufferTime: updatedProfessional.bufferTime,
      autoConfirmBookings: updatedProfessional.autoConfirmBookings,
    })
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/settings:", error)
    
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