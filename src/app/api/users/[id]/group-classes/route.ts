// src/app/api/users/[id]/group-classes/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { BookingStatus } from "@prisma/client"

// Schéma de validation simplifié
const groupClassSchema = z.object({
  serviceId: z.string().min(1, "Service requis"),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  maxParticipants: z.number().min(2, "Au moins 2 participants sont requis").max(50, "Maximum 50 participants").optional(),
  notes: z.string().optional().nullable(),
  isGroupClass: z.boolean().optional(),
  // Champs optionnels pour compatibilité avec le formulaire de rendez-vous
  clientId: z.string().optional(),
  recurrence: z.any().optional()
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
    
    // Récupérer les données brutes
    const body = await request.json()
    console.log("Données reçues pour création de cours collectif:", body)
    
    // Extraire les champs essentiels avec des valeurs par défaut
    const serviceId = body.serviceId
    const date = body.date
    const startTime = body.startTime
    const maxParticipants = Number(body.maxParticipants || 10)
    const notes = body.notes || null
    
    // Vérifications basiques
    if (!serviceId) {
      return NextResponse.json({ error: "Service requis" }, { status: 400 })
    }
    
    if (!date) {
      return NextResponse.json({ error: "Date requise" }, { status: 400 })
    }
    
    if (!startTime) {
      return NextResponse.json({ error: "Heure de début requise" }, { status: 400 })
    }
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      include: {
        user: true
      }
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer le service pour connaître sa durée
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })
    
    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le service peut accueillir des groupes
    if (service.maxParticipants <= 1) {
      return NextResponse.json(
        { error: "Ce service ne permet pas les cours collectifs" },
        { status: 400 }
      )
    }
    
    // Calculer les heures de début et de fin
    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + service.duration)
    
    // Ajouter le temps tampon si configuré
    if (professional.bufferTime) {
      endDateTime.setMinutes(endDateTime.getMinutes() + professional.bufferTime)
    }
    
    // Vérifier s'il existe des rendez-vous qui chevauchent cette plage horaire
    const overlappingAppointments = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        OR: [
          // Cas 1: Un rendez-vous existant commence pendant notre plage
          {
            startTime: {
              gte: startDateTime,
              lt: endDateTime
            }
          },
          // Cas 2: Un rendez-vous existant se termine pendant notre plage
          {
            endTime: {
              gt: startDateTime,
              lte: endDateTime
            }
          },
          // Cas 3: Un rendez-vous existant couvre entièrement notre plage
          {
            startTime: {
              lte: startDateTime
            },
            endTime: {
              gte: endDateTime
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
    
    // Trouver le premier client disponible ou en créer un factice si nécessaire
    let clientId;
    
    // Chercher un client existant
    const firstClient = await prisma.client.findFirst({
      orderBy: { createdAt: 'asc' }
    });
    
    if (firstClient) {
      clientId = firstClient.id;
    } else {
      // Créer un client "placeholder" lié au professionnel lui-même
      // Cela évite d'avoir un client "système" visible dans l'interface
      const placeholder = await prisma.client.create({
        data: {
          userId: userId,
          // Autres champs requis pour un client
          preferredLanguage: "fr",
        }
      });
      clientId = placeholder.id;
    }
    
    // Créer le cours collectif
    const groupClass = await prisma.booking.create({
      data: {
        startTime: startDateTime,
        endTime: endDateTime,
        status: BookingStatus.CONFIRMED,
        paymentStatus: "PENDING",
        notes: notes,
        serviceId: serviceId,
        clientId: clientId,
        professionalId: professional.id,
        isGroupClass: true,
        maxParticipants: maxParticipants,
        currentParticipants: 0
      },
      include: {
        service: true,
        groupParticipants: true
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
      { error: "Erreur interne du serveur", details: String(error) },
      { status: 500 }
    )
  }
}