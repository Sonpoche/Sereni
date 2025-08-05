// src/app/api/admin/subscriptions/[id]/retry-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'ID client Stripe manquant' },
        { status: 400 }
      )
    }

    // Récupérer la dernière facture impayée
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      status: 'open',
      limit: 1
    })

    if (invoices.data.length === 0) {
      return NextResponse.json(
        { error: 'Aucune facture impayée trouvée' },
        { status: 400 }
      )
    }

    const invoice = invoices.data[0]

    try {
      // Relancer le paiement
      const paidInvoice = await stripe.invoices.pay(invoice.id, {
        forgive: false // Ne pas pardonner automatiquement
      })

      // Log de l'action admin
      await prisma.adminLog.create({
        data: {
          adminId: session.user.id,
          action: 'PAYMENT_RETRY_INITIATED',
          details: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            userEmail: subscription.user.email,
            result: 'success'
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Paiement réussi',
        invoice: {
          id: paidInvoice.id,
          status: paidInvoice.status,
          amount: paidInvoice.amount_due
        }
      })

    } catch (paymentError: any) {
      // Log de l'échec
      await prisma.adminLog.create({
        data: {
          adminId: session.user.id,
          action: 'PAYMENT_RETRY_INITIATED',
          details: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            userEmail: subscription.user.email,
            result: 'failed',
            error: paymentError.message
          }
        }
      })

      // Si le paiement échoue à nouveau
      if (paymentError.type === 'StripeCardError') {
        return NextResponse.json({
          success: false,
          error: 'Le paiement a échoué à nouveau',
          details: paymentError.message
        }, { status: 400 })
      }

      throw paymentError
    }

  } catch (error: any) {
    console.error('Erreur relance paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la relance du paiement' },
      { status: 500 }
    )
  }
}