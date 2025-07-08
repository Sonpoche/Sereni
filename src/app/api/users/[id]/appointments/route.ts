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

    // Récupérer les sessions de cours collectifs
    const groupSessions = await prisma.groupSession.findMany({
      where: {
        groupClass: {
          professionalId: professional.id
        }
      },
      include: {
        groupClass: {
          select: {
            id: true,
            name: true,
            maxParticipants: true,
            category: true,
            isOnline: true,
            city: true
          }
        },
        registrations: {
          where: {
            status: { not: "CANCELLED" }
          },
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

    // Convertir les sessions de cours collectifs au format des rendez-vous pour le calendrier
    const groupClassAppointments = groupSessions.map(session => ({
      id: `group-${session.id}`,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status === "SCHEDULED" ? "CONFIRMED" : session.status,
      notes: session.notes,
      isGroupClass: true,
      groupClassData: {
        sessionId: session.id,
        groupClassId: session.groupClass.id,
        name: session.groupClass.name,
        maxParticipants: session.groupClass.maxParticipants,
        currentParticipants: session.registrations.length,
        category: session.groupClass.category,
        isOnline: session.groupClass.isOnline,
        city: session.groupClass.city,
        registrations: session.registrations.map(reg => ({
          id: reg.id,
          status: reg.status,
          registeredAt: reg.registeredAt,
          client: {
            id: reg.client.id,
            phone: reg.client.phone,
            user: {
              name: reg.client.user.name,
              email: reg.client.user.email
            }
          }
        }))
      },
      // Format compatible avec le calendrier existant
      client: null,
      service: {
        id: `group-service-${session.groupClass.id}`,
        name: session.groupClass.name,
        duration: (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000, // en minutes
        price: 0, // Prix géré au niveau du cours collectif
        color: "#10B981" // Couleur verte pour les cours collectifs
      }
    }))

    // Combiner les rendez-vous individuels et les cours collectifs
    const allAppointments = [
      ...appointments.map(apt => ({ ...apt, isGroupClass: false })),
      ...groupClassAppointments
    ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    
    return NextResponse.json(allAppointments)
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
    
    // Vérifier s'il existe des rendez-vous individuels qui chevauchent cette plage horaire
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

    // Vérifier s'il existe des sessions de cours collectifs qui chevauchent
    const overlappingGroupSessions = await prisma.groupSession.findMany({
      where: {
        groupClass: {
          professionalId: professional.id
        },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ],
        status: { not: "CANCELLED" }
      }
    })
    
    // Si des rendez-vous ou cours collectifs chevauchants sont trouvés, retourner une erreur
    if (overlappingAppointments.length > 0 || overlappingGroupSessions.length > 0) {
      const conflictType = overlappingAppointments.length > 0 ? "rendez-vous" : "cours collectif"
      return NextResponse.json(
        { 
          error: "Conflit d'horaire", 
          message: `Un ${conflictType} existant chevauche cette plage horaire. Veuillez sélectionner un autre créneau.`
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