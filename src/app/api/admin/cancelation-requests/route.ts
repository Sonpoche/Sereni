// src/app/api/admin/cancelation-requests/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Vérifier l'authentification admin
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de filtre
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Construire la condition de filtre
    let whereCondition: any = {}
    
    if (filter === 'pending') {
      whereCondition.status = 'pending'
    } else if (filter === 'processed') {
      whereCondition.status = { not: 'pending' }
    }

    // Récupérer les demandes avec les relations
    const requests = await prisma.cancelationRequest.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            currentPeriodEnd: true,
            stripeSubscriptionId: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    // Formater les données pour le frontend
    const formattedRequests = requests.map(request => ({
      id: request.id,
      reason: request.reason,
      feedback: request.feedback,
      contactPreference: request.contactPreference,
      status: request.status,
      adminResponse: request.adminResponse,
      requestedAt: request.requestedAt.toISOString(),
      processedAt: request.processedAt?.toISOString(),
      user: {
        id: request.user.id,
        name: request.user.name || 'Non renseigné',
        email: request.user.email || 'Non renseigné'
      },
      subscription: {
        id: request.subscription.id,
        plan: request.subscription.plan,
        currentPeriodEnd: request.subscription.currentPeriodEnd?.toISOString(),
        mrr: request.subscription.plan === 'premium' ? 40 : 20
      }
    }))

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      total: formattedRequests.length,
      pending: formattedRequests.filter(r => r.status === 'pending').length
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur récupération demandes annulation:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}