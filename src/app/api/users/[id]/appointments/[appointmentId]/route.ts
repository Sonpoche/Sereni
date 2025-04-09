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
    
    // Préparer les données de mise à jour
    const updateData: any = {}
    
    // Ajouter les champs fournis à l'objet de mise à jour
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId
    if (validatedData.serviceId !== undefined) updateData.serviceId = validatedData.serviceId
    
    // Si la date ou l'heure est modifiée, recalculer les heures de début et de fin
    if (validatedData.date || validatedData.startTime) {
      // Récupérer le service pour la durée si nécessaire ou utilisé le service existant
      let serviceDuration = existingAppointment.serviceId === validatedData.serviceId 
        ? null // On garde le même service
        : await prisma.service.findUnique({
            where: { id: validatedData.serviceId || existingAppointment.serviceId },
            select: { duration: true }
          })
      
      // Extraire la date et l'heure du rendez-vous existant
      const existingStartTime = existingAppointment.startTime
      const existingDate = existingStartTime.toISOString().split('T')[0]
      const existingTime = existingStartTime.toISOString().split('T')[1].substring(0, 5)
      
      // Utiliser les nouvelles valeurs ou conserver les anciennes
      const dateStr = validatedData.date || existingDate
      const startTimeStr = validatedData.startTime || existingTime
      
      // Créer la nouvelle date de début
      const startTime = new Date(`${dateStr}T${startTimeStr}:00`)
      updateData.startTime = startTime
      
      // Calculer la nouvelle heure de fin
      const endTime = new Date(startTime)
      const duration = serviceDuration?.duration || 
                      (existingAppointment.endTime.getTime() - existingAppointment.startTime.getTime()) / 60000
      
      endTime.setMinutes(endTime.getMinutes() + duration)
      
      // Ajouter le temps tampon si configuré
      if (professional.bufferTime) {
        endTime.setMinutes(endTime.getMinutes() + professional.bufferTime)
      }
      
      updateData.endTime = endTime
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
    
    // TOUJOURS supprimer complètement le rendez-vous ou la plage bloquée
    // au lieu de le marquer comme annulé
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