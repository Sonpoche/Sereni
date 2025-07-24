// src/app/api/users/[id]/invoices/[invoiceId]/send/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator"
import { Resend } from 'resend'
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

// Schema de validation pour l'envoi d'email
const sendEmailSchema = z.object({
  subject: z.string().optional(),
  message: z.string().optional(),
  sendCopy: z.boolean().default(false) // Envoyer une copie au professionnel
})

// POST - Envoyer la facture par email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, invoiceId: string } }
) {
  try {
    const session = await auth()
    const { id: userId, invoiceId } = params
    
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const body = await request.json()
    const validatedData = sendEmailSchema.parse(body)

    // Vérifier que l'utilisateur est un professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      include: { 
        user: { select: { name: true, email: true } }
      }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer la facture avec tous les détails
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        professionalId: professional.id 
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

    // Vérifier que le client a une adresse email
    if (!invoice.client.user.email) {
      return NextResponse.json(
        { error: "Le client n'a pas d'adresse email" },
        { status: 400 }
      )
    }

    // Générer le PDF de la facture
    const pdfBuffer = await generateInvoicePDF(invoice)

    // Préparer le contenu de l'email
    const defaultSubject = `Facture ${invoice.number} - ${professional.user.name || 'SereniBook'}`
    const defaultMessage = `
Bonjour ${invoice.client.user.name || 'Cher client'},

Veuillez trouver ci-jointe votre facture ${invoice.number}.

📋 Détails de la facture :
• Numéro : ${invoice.number}
• Date : ${new Date(invoice.date).toLocaleDateString('fr-FR')}
• Montant total : ${parseFloat(invoice.totalAmount.toString()).toFixed(2)} €
• Date d'échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}

${invoice.professional.invoiceSettings?.paymentTerms ? 
  `💳 Conditions de paiement :\n${invoice.professional.invoiceSettings.paymentTerms}\n\n` : ''
}${invoice.notes ? `📝 Notes :\n${invoice.notes}\n\n` : ''}Merci pour votre confiance !

Cordialement,
${professional.user.name || 'L\'équipe'}${professional.user.email ? `\n📧 ${professional.user.email}` : ''}${professional.phone ? `\n📞 ${professional.phone}` : ''}

---
Cette facture a été générée automatiquement par SereniBook.
    `.trim()

    const emailSubject = validatedData.subject || defaultSubject
    const emailMessage = validatedData.message || defaultMessage

    // Préparer les destinataires
    const recipients = [invoice.client.user.email]
    if (validatedData.sendCopy && professional.user.email) {
      recipients.push(professional.user.email)
    }

    // Envoyer l'email avec la facture en pièce jointe
    const emailResult = await resend.emails.send({
      from: `${professional.user.name || 'SereniBook'} <factures@serenibook.fr>`,
      to: recipients,
      subject: emailSubject,
      text: emailMessage,
      attachments: [
        {
          filename: `facture-${invoice.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (!emailResult.data) {
      throw new Error('Échec de l\'envoi de l\'email')
    }

    // Mettre à jour le statut de la facture si elle était en brouillon
    let updatedInvoice = invoice
    if (invoice.status === 'draft') {
      updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'sent' },
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
    }

    // Log de l'activité (optionnel - pour audit)
    console.log(`📧 Facture ${invoice.number} envoyée à ${invoice.client.user.email} par ${professional.user.name}`)

    return NextResponse.json({
      success: true,
      emailId: emailResult.data.id,
      message: "Facture envoyée avec succès",
      recipients: recipients.length,
      invoiceStatus: updatedInvoice.status
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erreur dans POST /api/users/[id]/invoices/[invoiceId]/send:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la facture" },
      { status: 500 }
    )
  }
}