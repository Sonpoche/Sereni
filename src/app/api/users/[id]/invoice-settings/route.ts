// src/app/api/users/[id]/invoice-settings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { z } from "zod"

// Schema de validation pour les paramètres de facturation
const invoiceSettingsSchema = z.object({
  businessName: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  logoUrl: z.string().url().optional(),
})

// GET - Récupérer les paramètres de facturation
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
      include: { invoiceSettings: true }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Si pas de paramètres, retourner des valeurs par défaut
    const settings = professional.invoiceSettings || {
      id: null,
      businessName: null,
      address: null,
      taxNumber: null,
      iban: null,
      swift: null,
      paymentTerms: "Paiement à 30 jours",
      notes: null,
      logoUrl: null,
      nextInvoiceNumber: 1
    }

    return NextResponse.json({
      id: professional.invoiceSettings?.id || null,
      businessName: settings.businessName,
      address: settings.address,
      taxNumber: settings.taxNumber,
      iban: settings.iban,
      swift: settings.swift,
      paymentTerms: settings.paymentTerms,
      notes: settings.notes,
      logoUrl: settings.logoUrl,
      nextInvoiceNumber: settings.nextInvoiceNumber
    })

  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/invoice-settings:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les paramètres de facturation
export async function PUT(
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

    // Valider les données
    const body = await request.json()
    const validatedData = invoiceSettingsSchema.parse(body)

    // Créer ou mettre à jour les paramètres
    const settings = await prisma.invoiceSettings.upsert({
      where: { professionalId: professional.id },
      create: {
        professionalId: professional.id,
        ...validatedData
      },
      update: validatedData
    })

    return NextResponse.json({
      id: settings.id,
      businessName: settings.businessName,
      address: settings.address,
      taxNumber: settings.taxNumber,
      iban: settings.iban,
      swift: settings.swift,
      paymentTerms: settings.paymentTerms,
      notes: settings.notes,
      logoUrl: settings.logoUrl,
      nextInvoiceNumber: settings.nextInvoiceNumber
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erreur dans PUT /api/users/[id]/invoice-settings:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}