// src/app/api/users/[id]/group-classes/[classId]/participants/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { BookingStatus } from "@prisma/client"

const participantSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string, classId: string } }
) {
  try {
    const { id: userId, classId } = params
    
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
    
    try {
      const validatedData = participantSchema.parse(body)
      
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
      
      // Vérifier que le cours collectif existe et appartient au professionnel
      const groupClass = await prisma.booking.findUnique({
        where: {
          id: classId,
          professionalId: professional.id,
          isGroupClass: true
        }
      })
      
      if (!groupClass) {
        return NextResponse.json(
          { error: "Cours collectif non trouvé" },
          { status: 404 }
        )
      }
      
      // Vérifier s'il reste des places disponibles
      if (groupClass.currentParticipants >= groupClass.maxParticipants) {
        return NextResponse.json(
          { error: "Ce cours est complet" },
          { status: 400 }
        )
      }
      
      // Vérifier si le client est déjà inscrit
      const existingParticipant = await prisma.groupParticipant.findFirst({
        where: {
          bookingId: classId,
          clientId: validatedData.clientId
        }
      })
      
      if (existingParticipant) {
        return NextResponse.json(
          { error: "Ce client est déjà inscrit à ce cours" },
          { status: 400 }
        )
      }
      
      // Vérifier que le client existe
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId }
      })
      
      if (!client) {
        return NextResponse.json(
          { error: "Client non trouvé" },
          { status: 404 }
        )
      }
      
      // Ajouter le participant au cours
      const participant = await prisma.groupParticipant.create({
        data: {
          bookingId: classId,
          clientId: validatedData.clientId,
          status: BookingStatus.CONFIRMED
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
      })
      
      // Mettre à jour le nombre de participants
      await prisma.booking.update({
        where: { id: classId },
        data: {
          currentParticipants: { increment: 1 }
        }
      })
      
      return NextResponse.json({
        success: true,
        participant
      })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides", details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/group-classes/[classId]/participants:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, classId: string } }
) {
  try {
    const { id: userId, classId } = params
    
    // Extraire l'ID du participant de l'URL
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')
    
    if (!participantId) {
      return NextResponse.json(
        { error: "ID du participant requis" },
        { status: 400 }
      )
    }
    
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
    
    // Vérifier que le cours collectif existe et appartient au professionnel
    const groupClass = await prisma.booking.findUnique({
      where: {
        id: classId,
        professionalId: professional.id,
        isGroupClass: true
      }
    })
    
    if (!groupClass) {
      return NextResponse.json(
        { error: "Cours collectif non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le participant existe et appartient à ce cours
    const participant = await prisma.groupParticipant.findUnique({
      where: {
        id: participantId,
        bookingId: classId
      }
    })
    
    if (!participant) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      )
    }
    
    // Supprimer le participant
    await prisma.groupParticipant.delete({
      where: { id: participantId }
    })
    
    // Mettre à jour le nombre de participants
    await prisma.booking.update({
      where: { id: classId },
      data: {
        currentParticipants: { decrement: 1 }
      }
    })
    
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/group-classes/[classId]/participants:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}