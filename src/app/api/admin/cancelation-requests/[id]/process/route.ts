// src/app/api/admin/cancelation-requests/[id]/process/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"
import { stripe } from "@/lib/stripe"
import { z } from "zod"

// Schema de validation
const processRequestSchema = z.object({
  action: z.enum(['approve', 'deny']),
  adminResponse: z.string().min(1, "La réponse admin est requise")
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Vérifier l'authentification admin
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 401 }
      )
    }

    const requestId = params.id
    const body = await request.json()
    
    // Valider les données
    const validatedData = processRequestSchema.parse(body)
    const { action, adminResponse } = validatedData

    // Récupérer la demande avec les relations
    const cancelationRequest = await prisma.cancelationRequest.findUnique({
      where: { id: requestId },
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
            stripeSubscriptionId: true,
            plan: true,
            currentPeriodEnd: true
          }
        }
      }
    })

    if (!cancelationRequest) {
      return NextResponse.json(
        { error: "Demande d'annulation non trouvée" },
        { status: 404 }
      )
    }

    if (cancelationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: "Cette demande a déjà été traitée" },
        { status: 400 }
      )
    }

    // Traitement selon l'action
    if (action === 'approve') {
      // Approuver l'annulation
      
      // 1. Annuler l'abonnement Stripe à la fin de la période
      if (cancelationRequest.subscription.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(
            cancelationRequest.subscription.stripeSubscriptionId,
            {
              cancel_at_period_end: true,
              metadata: {
                canceled_by_admin: 'true',
                cancelation_request_id: requestId,
                admin_user_id: session.user.id
              }
            }
          )

          console.log(`✅ [Admin] Abonnement Stripe annulé: ${cancelationRequest.subscription.stripeSubscriptionId}`)
        } catch (stripeError) {
          console.error("❌ [Admin] Erreur Stripe:", stripeError)
          return NextResponse.json(
            { error: "Erreur lors de l'annulation sur Stripe" },
            { status: 500 }
          )
        }
      }

      // 2. Mettre à jour l'abonnement en base
      await prisma.subscription.update({
        where: { id: cancelationRequest.subscription.id },
        data: { 
          cancelAtPeriodEnd: true
        }
      })

      // 3. Mettre à jour la demande d'annulation
      const updatedRequest = await prisma.cancelationRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          adminResponse,
          adminUserId: session.user.id,
          processedAt: new Date()
        }
      })

      // 4. Envoyer notification par email (simulation)
      console.log(`
📧 EMAIL ENVOYÉ À ${cancelationRequest.user.email}:

Sujet: Votre demande d'annulation SereniBook

Bonjour ${cancelationRequest.user.name || ''},

Votre demande d'annulation a été approuvée.

Votre abonnement restera actif jusqu'au ${cancelationRequest.subscription.currentPeriodEnd ? 
  new Date(cancelationRequest.subscription.currentPeriodEnd).toLocaleDateString('fr-FR') : 
  'fin de la période de facturation'}, après quoi il sera automatiquement annulé.

Message de notre équipe :
${adminResponse}

Nous sommes désolés de vous voir partir et espérons vous revoir bientôt !

L'équipe SereniBook
      `)

      return NextResponse.json({
        success: true,
        message: "Demande approuvée avec succès",
        request: {
          status: updatedRequest.status,
          processedAt: updatedRequest.processedAt
        }
      })

    } else {
      // Refuser l'annulation
      
      // 1. Mettre à jour la demande d'annulation
      const updatedRequest = await prisma.cancelationRequest.update({
        where: { id: requestId },
        data: {
          status: 'denied',
          adminResponse,
          adminUserId: session.user.id,
          processedAt: new Date()
        }
      })

      // 2. Envoyer notification par email (simulation)
      console.log(`
📧 EMAIL ENVOYÉ À ${cancelationRequest.user.email}:

Sujet: Réponse à votre demande d'annulation SereniBook

Bonjour ${cancelationRequest.user.name || ''},

Nous avons examiné votre demande d'annulation et souhaitons vous proposer une solution.

Votre abonnement reste actif et nous espérons pouvoir répondre à vos préoccupations.

Message de notre équipe :
${adminResponse}

Si vous souhaitez discuter davantage, n'hésitez pas à nous contacter directement.

L'équipe SereniBook
      `)

      return NextResponse.json({
        success: true,
        message: "Demande refusée - L'utilisateur a été notifié",
        request: {
          id: updatedRequest.id,
          status: updatedRequest.status,
          processedAt: updatedRequest.processedAt
        }
      })
    }

  } catch (error) {
    console.error("❌ [Admin] Erreur traitement demande annulation:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Données invalides", 
          details: error.errors.map(e => e.message) 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}