// src/app/api/user/get-plan/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"

export async function GET() {
  try {
    // Vérification de l'authentification
    const session = await auth()
    if (!session?.user?.id) {
      console.log('🔴 [GetPlan] Utilisateur non authentifié')
      return NextResponse.json({ 
        success: false,
        error: "Non authentifié" 
      }, { status: 401 })
    }

    // Récupération du plan depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { selectedPlan: true }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "Utilisateur non trouvé" 
      }, { status: 404 })
    }

    console.log('🟦 [GetPlan] Plan récupéré pour:', session.user.email, 'Plan:', user.selectedPlan)

    return NextResponse.json({ 
      success: true,
      data: { 
        selectedPlan: user.selectedPlan || 'premium' // Défaut premium si null
      }
    })

  } catch (error) {
    console.error('🔴 [GetPlan] Erreur:', error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur interne du serveur" 
    }, { status: 500 })
  }
}