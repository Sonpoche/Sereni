// src/app/api/users/[id]/blocked-times/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { BookingStatus } from "@prisma/client"

// Schéma de validation pour les plages bloquées
const blockedTimeSchema = z.object({
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  title: z.string().min(1, "Titre requis"),
  notes: z.string().optional(),
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
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer toutes les plages bloquées
    const blockedTimes = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        status: "CANCELLED",
        // Utilisez une condition explicite pour clientId au lieu de null
        clientId: '00000000-0000-0000-0000-000000000000'
      },
      orderBy: { startTime: 'asc' }
    })
    
    return NextResponse.json(blockedTimes)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/blocked-times:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const validatedData = blockedTimeSchema.parse(body)
    
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
    
    // Calculer les dates de début et de fin
    const startDate = new Date(`${validatedData.date}T${validatedData.startTime}:00`)
    const endDate = new Date(`${validatedData.date}T${validatedData.endTime}:00`)
    
    // Créer la plage bloquée comme un rendez-vous spécial
    const blockedTime = await prisma.booking.create({
      data: {
        startTime: startDate,
        endTime: endDate,
        status: BookingStatus.CANCELLED, // Utiliser CANCELLED pour marquer comme indisponible
        paymentStatus: "PENDING",
        notes: validatedData.notes || validatedData.title,
        professionalId: professional.id,
        // Utiliser l'ID système pour le client et le service
        serviceId: "00000000-0000-0000-0000-000000000000",
        clientId: "00000000-0000-0000-0000-000000000000",
      }
    })
    
    return NextResponse.json(blockedTime)
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/blocked-times:", error)
    
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