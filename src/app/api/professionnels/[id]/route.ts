// src/app/api/professionnels/[id]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Récupérer le profil professionnel avec ses relations
    const professional = await prisma.professional.findFirst({
      where: { 
        userId: userId,
        user: {
          hasProfile: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        services: {
          where: { active: true },
          orderBy: { price: 'asc' }
        },
        availability: true, // Incluons les disponibilités
      }
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(professional)
  } catch (error) {
    console.error("Erreur dans GET /api/professionnels/[id]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}