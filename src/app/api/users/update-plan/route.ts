// src/app/api/user/update-plan/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

const updatePlanSchema = z.object({
  selectedPlan: z.enum(['standard', 'premium'])
})

export async function POST(request: Request) {
  try {
    // Vérification de l'authentification
    const session = await auth()
    if (!session?.user?.id) {
      console.log('🔴 [UpdatePlan] Utilisateur non authentifié')
      return NextResponse.json({ 
        success: false,
        error: "Non authentifié" 
      }, { status: 401 })
    }

    // Récupération et validation des données
    const body = await request.json()
    console.log('🟦 [UpdatePlan] Données reçues:', body)

    const { selectedPlan } = updatePlanSchema.parse(body)

    // Mise à jour du plan dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { selectedPlan }
    })

    console.log('🟦 [UpdatePlan] Plan mis à jour pour:', session.user.email, 'Plan:', selectedPlan)

    return NextResponse.json({ 
      success: true,
      data: { selectedPlan: updatedUser.selectedPlan }
    })

  } catch (error) {
    console.error('🔴 [UpdatePlan] Erreur:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        error: "Plan invalide",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: false,
      error: "Erreur interne du serveur" 
    }, { status: 500 })
  }
}