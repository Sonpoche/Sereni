// src/app/api/clients/[id]/invoices/[invoiceId]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator"

// GET - Télécharger le PDF de la facture (côté client)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, invoiceId: string } }
) {
  try {
    const session = await auth()
    const { id: userId, invoiceId } = params
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est un client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: "Accès réservé aux clients" },
        { status: 403 }
      )
    }

    // Vérifier que l'utilisateur accède à ses propres factures
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Récupérer le profil client
    const client = await prisma.client.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Profil client non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer la facture avec tous les détails
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        clientId: client.id // S'assurer que la facture appartient au client
      },
      include: {
        client: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        items: true,
        professional: {
          include: {
            user: { select: { name: true, email: true } },
            invoiceSettings: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      )
    }

    // Générer le PDF
    const pdfBuffer = await generateInvoicePDF(invoice)

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Erreur dans GET /api/clients/[id]/invoices/[invoiceId]/pdf:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    )
  }
}