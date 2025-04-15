// src/app/api/users/[id]/group-classes/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { z } from "zod"
import { BookingStatus } from "@prisma/client"

const groupClassSchema = z.object({
  serviceId: z.string().min(1, "Service requis"),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  maxParticipants: z.number().min(2, "Au moins 2 participants sont requis").max(50, "Maximum 50 participants"),
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
    
    // Récupérer tous les cours collectifs du professionnel
    const groupClasses = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        isGroupClass: true
      },
      include: {
        service: true,
        groupParticipants: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })
    
    return NextResponse.json(groupClasses)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/group-classes:", error)
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
    const validatedData = groupClassSchema.parse(body)
    
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
    
    // Récupérer le service pour vérifier s'il peut gérer des cours collectifs
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
    })
    
    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      )
    }
    
    // Calculer les heures de début et de fin
    const dateStr = validatedData.date
    const startTimeStr = validatedData.startTime
    
    const startTime = new Date(`${dateStr}T${startTimeStr}:00`)
    
    // Calculer l'heure de fin en ajoutant la durée du service
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + service.duration)
    
    // Ajouter le temps tampon si configuré
    if (professional.bufferTime) {
      endTime.setMinutes(endTime.getMinutes() + professional.bufferTime)
    }
    
    // Vérifier s'il existe des rendez-vous qui chevauchent cette plage horaire
    const overlappingAppointments = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        OR: [
          // Cas 1: Un rendez-vous existant commence pendant notre plage
          {
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          // Cas 2: Un rendez-vous existant se termine pendant notre plage
          {
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          // Cas 3: Un rendez-vous existant couvre entièrement notre plage
          {
            startTime: {
              lte: startTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
    })
    
    // Si des rendez-vous chevauchants sont trouvés, retourner une erreur
    if (overlappingAppointments.length > 0) {
      return NextResponse.json(
        { 
          error: "Conflit d'horaire", 
          message: "Un ou plusieurs rendez-vous existants chevauchent cette plage horaire. Veuillez sélectionner un autre créneau."
        },
        { status: 409 } // 409 Conflict
      )
    }
    
    // Créer le cours collectif (sans client initial)
    const groupClass = await prisma.booking.create({
      data: {
        startTime,
        endTime,
        status: BookingStatus.CONFIRMED,
        paymentStatus: "PENDING",
        notes: validatedData.notes || null,
        serviceId: validatedData.serviceId,
        clientId: professional.userId, // Associer le professionnel comme client temporaire
        professionalId: professional.id,
        isGroupClass: true,
        maxParticipants: validatedData.maxParticipants,
        currentParticipants: 0
      },
      include: {
        service: true
      }
    })
    
    return NextResponse.json({
      success: true,
      groupClass
    })
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/group-classes:", error)
    
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