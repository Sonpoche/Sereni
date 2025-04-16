// src/app/api/users/[id]/group-classes/[classId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"

export async function GET(
  request: Request,
  { params }: { params: { id: string; classId: string } }
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
    
    // Récupérer le cours collectif
    const groupClass = await prisma.booking.findUnique({
      where: {
        id: classId,
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
      }
    })
    
    if (!groupClass) {
      return NextResponse.json(
        { error: "Cours collectif non trouvé" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(groupClass)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/group-classes/[classId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; classId: string } }
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
    
    // Supprimer d'abord tous les participants associés
    await prisma.groupParticipant.deleteMany({
      where: {
        bookingId: classId
      }
    })
    
    // Supprimer le cours collectif
    await prisma.booking.delete({
      where: {
        id: classId
      }
    })
    
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/group-classes/[classId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}