// src/app/api/users/[id]/appointments/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { BookingStatus } from "@prisma/client"

// Schéma de validation pour les rendez-vous individuels uniquement
const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  serviceId: z.string().min(1, "Service requis"),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
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
    
    // Récupérer tous les rendez-vous individuels du praticien
    const appointments = await prisma.booking.findMany({
      where: { 
        professionalId: professional.id,
        isGroupClass: false // Seulement les RDV individuels
      },
      include: {
        client: {
            select: {
              id: true,
              phone: true,
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
        service: true,
      },
      orderBy: { startTime: 'asc' }
    })
    
    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/appointments:", error)
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
    const validatedData = appointmentSchema.parse(body)
    
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
    
    // Récupérer le service pour connaître sa durée
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
        ],
        status: { not: BookingStatus.CANCELLED }
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
    
    // Créer le rendez-vous individuel
    const appointment = await prisma.booking.create({
      data: {
        startTime,
        endTime,
        status: professional.autoConfirmBookings ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
        paymentStatus: "PENDING",
        notes: validatedData.notes || null,
        serviceId: validatedData.serviceId,
        clientId: validatedData.clientId,
        professionalId: professional.id,
        isGroupClass: false, // Forcer à false pour les RDV individuels
        maxParticipants: 1,
        currentParticipants: 1,
      },
      include: {
        client: {
            select: {
              id: true,
              phone: true,
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
        service: true,
      },
    })
    
    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/appointments:", error)
    
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