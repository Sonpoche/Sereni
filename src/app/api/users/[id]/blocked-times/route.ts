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
        // Rechercher les réservations du client système
        client: {
          user: {
            email: "system@serenibook.app"
          }
        }
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
    
    // Vérifier s'il existe des plages blocages ou rendez-vous qui chevauchent cette plage
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        OR: [
          // Cas 1: Une réservation existante commence pendant notre plage
          {
            startTime: {
              gte: startDate,
              lt: endDate
            }
          },
          // Cas 2: Une réservation existante se termine pendant notre plage
          {
            endTime: {
              gt: startDate,
              lte: endDate
            }
          },
          // Cas 3: Une réservation existante couvre entièrement notre plage
          {
            startTime: {
              lte: startDate
            },
            endTime: {
              gte: endDate
            }
          }
        ],
        // Utiliser AND pour combiner les conditions de statut
        AND: [
          {
            OR: [
              { status: { not: BookingStatus.CANCELLED } },
              {
                AND: [
                  { status: BookingStatus.CANCELLED },
                  {
                    client: {
                      user: {
                        email: "system@serenibook.app"
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    })
    
    // Si des chevauchements sont trouvés, retourner une erreur
    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { 
          error: "Conflit d'horaire", 
          message: "Un ou plusieurs rendez-vous ou plages bloquées existants chevauchent cette plage horaire. Veuillez sélectionner un autre créneau."
        },
        { status: 409 } // 409 Conflict
      )
    }
    
    // Trouver ou créer un service pour les plages bloquées
    // Utiliser findFirst au lieu de findMany pour éviter les doublons
    let blockingService = await prisma.service.findFirst({
      where: { 
        professionalId: professional.id,
        name: "Blocage de plage"
      }
    })
    
    // Si le service n'existe pas, on le crée une seule fois
    if (!blockingService) {
      blockingService = await prisma.service.create({
        data: {
          name: "Blocage de plage",
          description: "Plage horaire bloquée",
          duration: 60, // Durée par défaut
          price: 0,
          professionalId: professional.id,
          active: false // Marquer comme inactif pour qu'il n'apparaisse pas dans la liste des services
        }
      })
    }
    
    // Trouver ou créer un client système
    let systemClient = await prisma.client.findFirst({
      where: {
        user: {
          email: "system@serenibook.app"
        }
      }
    })
    
    if (!systemClient) {
      // Créer un utilisateur système s'il n'existe pas
      const systemUser = await prisma.user.findUnique({
        where: { email: "system@serenibook.app" }
      }) || await prisma.user.create({
        data: {
          name: "Système",
          email: "system@serenibook.app",
          role: "CLIENT",
          hasProfile: true
        }
      })
      
      // Créer le client système
      systemClient = await prisma.client.create({
        data: {
          userId: systemUser.id,
          preferredLanguage: "fr"
        }
      })
      
      // Associer ce client au professionnel
      await prisma.professionalClient.create({
        data: {
          professionalId: professional.id,
          clientId: systemClient.id
        }
      })
    }
    
    // Créer la plage bloquée comme un rendez-vous spécial
    const blockedTime = await prisma.booking.create({
      data: {
        startTime: startDate,
        endTime: endDate,
        status: BookingStatus.CANCELLED, // Utiliser CANCELLED pour marquer comme indisponible
        paymentStatus: "PENDING",
        notes: validatedData.notes || validatedData.title,
        professionalId: professional.id,
        serviceId: blockingService.id,
        clientId: systemClient.id
      }
    })
    
    return NextResponse.json(blockedTime)
  } catch (error: unknown) {
    console.error("Erreur dans POST /api/users/[id]/blocked-times:", error)
    
    // Gérer error comme un objet inconnu
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Erreur inconnue";
    
    console.error("Message d'erreur:", errorMessage)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: errorMessage },
      { status: 500 }
    )
  }
}