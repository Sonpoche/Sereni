// src/app/api/users/[id]/first-visit/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { 
        isFirstVisit: false
      }
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" }, 
        { status: 404 }
      )
    }

    console.log('🟦 [API] Première visite marquée pour:', updatedUser.id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('🔴 [API] Erreur lors de la mise à jour de la première visite:', error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}