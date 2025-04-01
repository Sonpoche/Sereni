// src/app/api/users/[id]/email-status/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // S'assurer que params.id est une string
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur manquant" }, 
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified ? true : false
    })
    
  } catch (error) {
    console.error('🔴 [API] Erreur lors de la vérification de l\'email:', error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}