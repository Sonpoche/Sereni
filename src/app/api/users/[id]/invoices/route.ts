// src/app/api/users/[id]/invoices/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { z } from "zod"

// Schema de validation pour création de facture
const createInvoiceSchema = z.object({
  clientId: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })),
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(20), // TVA française par défaut
})

// GET - Récupérer toutes les factures du professionnel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id: userId } = params
    
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

    // Récupérer les factures avec les détails client et items
    const invoices = await prisma.invoice.findMany({
      where: { professionalId: professional.id },
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formater les données pour le front-end
    const formattedInvoices = invoices.map(invoice => ({
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
    }))

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/invoices:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle facture
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id: userId } = params
    
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est un professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
      include: { invoiceSettings: true }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Valider les données de la requête
    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

    // Vérifier que le client appartient au professionnel
    const clientRelation = await prisma.professionalClient.findUnique({
      where: {
        professionalId_clientId: {
          professionalId: professional.id,
          clientId: validatedData.clientId
        }
      }
    })

    if (!clientRelation) {
      return NextResponse.json(
        { error: "Client non associé à ce professionnel" },
        { status: 403 }
      )
    }

    // Générer le numéro de facture
    const invoiceSettings = professional.invoiceSettings
    const nextNumber = invoiceSettings?.nextInvoiceNumber || 1
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`

    // Calculer les totaux
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

    const taxAmount = (subtotalAmount * validatedData.taxRate) / 100
    const totalAmount = subtotalAmount + taxAmount

    // Créer la facture avec les items
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        date: new Date(),
        dueDate: validatedData.dueDate,
        status: 'draft',
        totalAmount,
        taxRate: validatedData.taxRate,
        taxAmount,
        notes: validatedData.notes,
        clientId: validatedData.clientId,
        professionalId: professional.id,
        items: {
          create: processedItems
        }
      },
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

    // Mettre à jour le compteur de factures
    if (invoiceSettings) {
      await prisma.invoiceSettings.update({
        where: { id: invoiceSettings.id },
        data: { nextInvoiceNumber: nextNumber + 1 }
      })
    } else {
      // Créer les paramètres s'ils n'existent pas
      await prisma.invoiceSettings.create({
        data: {
          professionalId: professional.id,
          nextInvoiceNumber: 2
        }
      })
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
      notes: invoice.notes,
      client: {
        id: invoice.client.id,
        name: invoice.client.user.name,
        email: invoice.client.user.email,
        phone: invoice.client.phone
      },
      items: invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        totalPrice: parseFloat(item.totalPrice.toString())
      })),
      createdAt: invoice.createdAt.toISOString()
    }

    return NextResponse.json(formattedInvoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erreur dans POST /api/users/[id]/invoices:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}