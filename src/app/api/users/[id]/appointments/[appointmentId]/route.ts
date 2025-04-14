// src/app/api/users/[id]/appointments/[appointmentId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { BookingStatus } from "@prisma/client"

// Schéma de validation pour la mise à jour d'un rendez-vous
const appointmentUpdateSchema = z.object({
  clientId: z.string().min(1, "Client requis").optional(),
  serviceId: z.string().min(1, "Service requis").optional(),
  date: z.string().min(1, "Date requise").optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)").optional(),
  notes: z.string().optional(),
  status: z.enum([
    BookingStatus.PENDING, 
    BookingStatus.CONFIRMED, 
    BookingStatus.CANCELLED, 
    BookingStatus.COMPLETED, 
    BookingStatus.NO_SHOW
  ]).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string, appointmentId: string } }
) {
  try {
    const { id: userId, appointmentId } = params
    
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
    
    // Récupérer le rendez-vous avec les relations
    const appointment = await prisma.booking.findUnique({
      where: { 
        id: appointmentId,
        professionalId: professional.id // Sécurité: vérifier que le rendez-vous appartient au professionnel
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
      }
    })
    
    if (!appointment) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé ou non autorisé" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/appointments/[appointmentId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, appointmentId: string } }
) {
  try {
    const { id: userId, appointmentId } = params
    
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
    const validatedData = appointmentUpdateSchema.parse(body)
    
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
    
    // Récupérer le rendez-vous existant
    const existingAppointment = await prisma.booking.findUnique({
      where: { 
        id: appointmentId,
        professionalId: professional.id // Sécurité: vérifier que le rendez-vous appartient au professionnel
      }
    })
    
    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé ou non autorisé" },
        { status: 404 }
      )
    }
    
    // Si on ne modifie pas la date/heure ou si on annule le rendez-vous, on ne vérifie pas les conflits
    const isDateTimeChange = validatedData.date || validatedData.startTime
    const isStatusChangeToCancelled = validatedData.status === "CANCELLED"
    
    // Préparer les données de mise à jour
    const updateData: any = {}
    
    // Ajouter les champs fournis à l'objet de mise à jour
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId
    if (validatedData.serviceId !== undefined) updateData.serviceId = validatedData.serviceId
    
    // Nouvelle date/heure de début et de fin
    let newStartTime = existingAppointment.startTime
    let newEndTime = existingAppointment.endTime
    
    // Si la date ou l'heure est modifiée, recalculer les heures de début et de fin
    if (isDateTimeChange) {
      // Récupérer le service pour la durée si nécessaire ou utilisé le service existant
      let serviceDuration = existingAppointment.serviceId === validatedData.serviceId 
        ? null // On garde le même service
        : await prisma.service.findUnique({
            where: { id: validatedData.serviceId || existingAppointment.serviceId },
            select: { duration: true }
          })
      
      // Extraire la date et l'heure du rendez-vous existant
      const existingDate = existingAppointment.startTime.toISOString().split('T')[0]
      const existingTime = existingAppointment.startTime.toISOString().split('T')[1].substring(0, 5)
      
      // Utiliser les nouvelles valeurs ou conserver les anciennes
      const dateStr = validatedData.date || existingDate
      const startTimeStr = validatedData.startTime || existingTime
      
      // Créer la nouvelle date de début
      newStartTime = new Date(`${dateStr}T${startTimeStr}:00`)
      updateData.startTime = newStartTime
      
      // Calculer la nouvelle heure de fin
      newEndTime = new Date(newStartTime)
      const duration = serviceDuration?.duration || 
                      (existingAppointment.endTime.getTime() - existingAppointment.startTime.getTime()) / 60000
      
      newEndTime.setMinutes(newEndTime.getMinutes() + duration)
      
      // Ajouter le temps tampon si configuré
      if (professional.bufferTime) {
        newEndTime.setMinutes(newEndTime.getMinutes() + professional.bufferTime)
      }
      
      updateData.endTime = newEndTime
    }
    
    // Vérifier les conflits uniquement si on modifie la date/heure et qu'on n'annule pas
    if (isDateTimeChange && !isStatusChangeToCancelled) {
      // Vérifier les conflits avec d'autres rendez-vous (en excluant le rendez-vous actuel)
      const conflictingAppointment = await prisma.booking.findFirst({
        where: {
          professionalId: professional.id,
          id: { not: appointmentId }, // Exclure le rendez-vous en cours de modification
          OR: [
            // Commence pendant un autre rendez-vous/blocage
            {
              startTime: { lte: newStartTime },
              endTime: { gt: newStartTime }
            },
            // Finit pendant un autre rendez-vous/blocage
            {
              startTime: { lt: newEndTime },
              endTime: { gte: newEndTime }
            },
            // Englobe complètement un autre rendez-vous/blocage
            {
              startTime: { gte: newStartTime },
              endTime: { lte: newEndTime }
            },
            // Est entièrement englobé par un autre rendez-vous/blocage
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gte: newEndTime } }
              ]
            }
          ]
        },
        include: {
          client: {
            include: {
              user: true
            }
          }
        }
      });
      
      if (conflictingAppointment) {
        // Déterminer s'il s'agit d'un rendez-vous normal ou d'une plage bloquée
        const isBlockedTime = conflictingAppointment.status === "CANCELLED" && 
          conflictingAppointment.client?.user?.email === "system@serenibook.app";
      
        return NextResponse.json(
          { 
            error: isBlockedTime 
              ? "Ce créneau chevauche une plage horaire bloquée. Veuillez d'abord supprimer la plage bloquée."
              : "Ce créneau est déjà réservé par un autre rendez-vous. Veuillez l'annuler ou le supprimer d'abord.",
            conflictingAppointment 
          },
          { status: 409 }
        );
      }
    }
    
    // Mettre à jour le rendez-vous
    const updatedAppointment = await prisma.booking.update({
      where: { id: appointmentId },
      data: updateData,
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
    
    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/appointments/[appointmentId]:", error)
    
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, appointmentId: string } }
) {
  try {
    const { id: userId, appointmentId } = params
    
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
    
    // Vérifier que le rendez-vous existe et appartient au professionnel
    const appointment = await prisma.booking.findUnique({
      where: { 
        id: appointmentId,
        professionalId: professional.id
      }
    })
    
    if (!appointment) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé ou non autorisé" },
        { status: 404 }
      )
    }
    
    // Supprimer le rendez-vous
    await prisma.booking.delete({
      where: { id: appointmentId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/appointments/[appointmentId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}