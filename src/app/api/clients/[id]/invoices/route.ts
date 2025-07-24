// src/app/api/clients/[id]/invoices/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"

// GET - Récupérer toutes les factures du client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const { id: userId } = params
    
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

    // Récupérer les factures du client avec les détails professionnel
    const invoices = await prisma.invoice.findMany({
      where: { clientId: client.id },
      include: {
        professional: {
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
      professional: {
        id: invoice.professional.id,
        name: invoice.professional.user.name,
        email: invoice.professional.user.email,
        phone: invoice.professional.phone,
        address: invoice.professional.address,
        city: invoice.professional.city,
        postalCode: invoice.professional.postalCode
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
    console.error("Erreur dans GET /api/clients/[id]/invoices:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}