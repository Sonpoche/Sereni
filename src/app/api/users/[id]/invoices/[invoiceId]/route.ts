// src/app/api/users/[id]/invoices/[invoiceId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { z } from "zod"

// Schema de validation pour mise à jour de facture
const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  paymentDate: z.string().transform(str => new Date(str)).optional(),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
})

// GET - Récupérer une facture spécifique
export async function GET(
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

    // Vérifier que l'utilisateur est un professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer la facture
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        professionalId: professional.id 
      },
      include: {
        client: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        items: true,
        bookings: {
          include: {
            service: {
              select: { name: true }
            }
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

    // Formater la réponse
    const formattedInvoice = {
      id: invoice.id,
      number: invoice.number,
      date: invoice.date.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status,
      totalAmount: parseFloat(invoice.totalAmount.toString()),
      taxRate: parseFloat(invoice.taxRate.toString()),
      taxAmount: parseFloat(invoice.taxAmount.toString()),
      paymentDate: invoice.paymentDate?.toISOString() || null,
      paymentMethod: invoice.paymentMethod,
      paymentRef: invoice.paymentRef,
      notes: invoice.notes,
      client: {
        id: invoice.client.id,
        name: invoice.client.user.name,
        email: invoice.client.user.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
        city: invoice.client.city,
        postalCode: invoice.client.postalCode
      },
      items: invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        totalPrice: parseFloat(item.totalPrice.toString())
      })),
      bookings: invoice.bookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        serviceName: booking.service.name
      })),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString()
    }

    return NextResponse.json(formattedInvoice)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/invoices/[invoiceId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une facture
export async function PUT(
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

    // Vérifier que l'utilisateur est un professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Valider les données
    const body = await request.json()
    const validatedData = updateInvoiceSchema.parse(body)

    // Vérifier que la facture existe et appartient au professionnel
    const existingInvoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        professionalId: professional.id 
      },
      include: { items: true }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      )
    }

    // Préparer les données de mise à jour
    let updateData: any = {}

    // Mise à jour des champs simples
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.dueDate) updateData.dueDate = validatedData.dueDate
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.paymentDate) updateData.paymentDate = validatedData.paymentDate
    if (validatedData.paymentMethod) updateData.paymentMethod = validatedData.paymentMethod
    if (validatedData.paymentRef) updateData.paymentRef = validatedData.paymentRef

    // Mise à jour des items si fournis
    if (validatedData.items) {
      // Calculer les nouveaux totaux
      let subtotalAmount = 0
      const processedItems = validatedData.items.map(item => {
        const totalPrice = item.quantity * item.unitPrice
        subtotalAmount += totalPrice
        
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice
        }
      })

      const taxRate = validatedData.taxRate || parseFloat(existingInvoice.taxRate.toString())
      const taxAmount = (subtotalAmount * taxRate) / 100
      const totalAmount = subtotalAmount + taxAmount

      updateData.totalAmount = totalAmount
      updateData.taxRate = taxRate
      updateData.taxAmount = taxAmount

      // Supprimer les anciens items et créer les nouveaux
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId }
      })

      updateData.items = {
        create: processedItems
      }
    }

    // Effectuer la mise à jour
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        items: true
      }
    })

    // Formater la réponse
    const formattedInvoice = {
      id: updatedInvoice.id,
      number: updatedInvoice.number,
      date: updatedInvoice.date.toISOString(),
      dueDate: updatedInvoice.dueDate.toISOString(),
      status: updatedInvoice.status,
      totalAmount: parseFloat(updatedInvoice.totalAmount.toString()),
      taxRate: parseFloat(updatedInvoice.taxRate.toString()),
      taxAmount: parseFloat(updatedInvoice.taxAmount.toString()),
      paymentDate: updatedInvoice.paymentDate?.toISOString() || null,
      paymentMethod: updatedInvoice.paymentMethod,
      paymentRef: updatedInvoice.paymentRef,
      notes: updatedInvoice.notes,
      client: {
        id: updatedInvoice.client.id,
        name: updatedInvoice.client.user.name,
        email: updatedInvoice.client.user.email,
        phone: updatedInvoice.client.phone
      },
      items: updatedInvoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        totalPrice: parseFloat(item.totalPrice.toString())
      })),
      updatedAt: updatedInvoice.updatedAt.toISOString()
    }

    return NextResponse.json(formattedInvoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erreur dans PUT /api/users/[id]/invoices/[invoiceId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une facture
export async function DELETE(
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

    // Vérifier que l'utilisateur est un professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que la facture existe et appartient au professionnel
    const existingInvoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        professionalId: professional.id 
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      )
    }

    // Empêcher la suppression des factures payées
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: "Impossible de supprimer une facture payée" },
        { status: 400 }
      )
    }

    // Supprimer la facture (les items seront supprimés en cascade)
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/invoices/[invoiceId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}