// src/app/api/users/[id]/blocked-times/[blockId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    const { id: userId, blockId } = params
    
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
    
    // Vérifier que la plage bloquée existe et appartient au professionnel
    const blockedTime = await prisma.booking.findUnique({
      where: { 
        id: blockId,
        professionalId: professional.id,
        client: {
          user: {
            email: "system@serenibook.app"
          }
        }
      }
    })
    
    if (!blockedTime) {
      return NextResponse.json(
        { error: "Plage bloquée non trouvée ou non autorisée" },
        { status: 404 }
      )
    }
    
    // Supprimer la plage bloquée
    await prisma.booking.delete({
      where: { id: blockId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Erreur dans DELETE /api/users/[id]/blocked-times/[blockId]:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: errorMessage },
      { status: 500 }
    )
  }
}