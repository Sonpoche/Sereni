// src/app/api/users/[id]/clients/[clientId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour la mise à jour d'un client
const updateClientSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string, clientId: string } }
) {
  try {
    const { id: userId, clientId } = params
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le client est associé au professionnel
    // soit via ProfessionalClient, soit via des rendez-vous
    const isAssociated = await prisma.professionalClient.findFirst({
      where: {
        professionalId: professional.id,
        clientId: client.id
      }
    })
    
    const hasBooking = await prisma.booking.findFirst({
      where: {
        professionalId: professional.id,
        clientId: client.id
      }
    })
    
    if (!isAssociated && !hasBooking) {
      return NextResponse.json(
        { error: "Client non associé à ce professionnel" },
        { status: 403 }
      )
    }
    
    // Récupérer tous les rendez-vous du client avec ce professionnel
    const appointments = await prisma.booking.findMany({
      where: {
        clientId: client.id,
        professionalId: professional.id
      },
      include: {
        service: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })
    
    // Formater les données pour le front-end
    const formattedClient = {
      id: client.id,
      user: client.user,
      phone: client.phone,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode,
      notes: client.notes,
      createdAt: client.createdAt.toISOString(),
    }
    
    // Formater les rendez-vous
    const formattedAppointments = appointments.map(booking => ({
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      notes: booking.notes,
      service: {
        id: booking.service.id,
        name: booking.service.name,
        duration: booking.service.duration,
        price: booking.service.price,
      }
    }))
    
    return NextResponse.json({
      client: formattedClient,
      appointments: formattedAppointments
    })
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/clients/[clientId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, clientId: string } }
) {
  try {
    const { id: userId, clientId } = params
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le client est associé au professionnel
    const isAssociated = await prisma.professionalClient.findFirst({
      where: {
        professionalId: professional.id,
        clientId: client.id
      }
    })
    
    const hasBooking = await prisma.booking.findFirst({
      where: {
        professionalId: professional.id,
        clientId: client.id
      }
    })
    
    if (!isAssociated && !hasBooking) {
      return NextResponse.json(
        { error: "Client non associé à ce professionnel" },
        { status: 403 }
      )
    }
    
    // Mettre à jour l'utilisateur (nom et email)
    await prisma.user.update({
      where: { id: client.userId },
      data: {
        name: validatedData.name,
        email: validatedData.email
      }
    })
    
    // Mettre à jour le profil client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        phone: validatedData.phone,
        address: validatedData.address,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        notes: validatedData.notes
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    // Compter les rendez-vous avec ce professionnel
    const appointmentsCount = await prisma.booking.count({
      where: {
        clientId,
        professionalId: professional.id
      }
    })
    
    // Récupérer le dernier rendez-vous
    const lastAppointment = await prisma.booking.findFirst({
      where: {
        clientId,
        professionalId: professional.id
      },
      orderBy: {
        startTime: 'desc'
      }
    })
    
    // Retourner le client mis à jour
    return NextResponse.json({
      id: updatedClient.id,
      user: updatedClient.user,
      phone: updatedClient.phone,
      address: updatedClient.address,
      city: updatedClient.city,
      postalCode: updatedClient.postalCode,
      notes: updatedClient.notes,
      createdAt: updatedClient.createdAt.toISOString(),
      appointmentsCount: appointmentsCount,
      lastAppointment: lastAppointment?.startTime.toISOString() || null
    })
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/clients/[clientId]:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, clientId: string } }
) {
  try {
    const { id: userId, clientId } = params
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le client est associé au professionnel
    const isAssociated = await prisma.professionalClient.findFirst({
      where: {
        professionalId: professional.id,
        clientId: client.id
      }
    })
    
    const hasBooking = await prisma.booking.findFirst({
      where: {
        professionalId: professional.id,
        clientId: client.id
      }
    })
    
    if (!isAssociated && !hasBooking) {
      return NextResponse.json(
        { error: "Client non associé à ce professionnel" },
        { status: 403 }
      )
    }
    
    // Supprimer tous les rendez-vous de ce client avec ce professionnel
    await prisma.booking.deleteMany({
      where: {
        clientId,
        professionalId: professional.id
      }
    })
    
    // Supprimer l'association professionalClient s'il existe
    if (isAssociated) {
      await prisma.professionalClient.delete({
        where: {
          id: isAssociated.id
        }
      })
    }
    
    // Note: Nous ne supprimons pas le client lui-même, car il pourrait avoir des rendez-vous
    // avec d'autres professionnels. Nous supprimons uniquement l'association entre ce client
    // et ce professionnel.
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/clients/[clientId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}