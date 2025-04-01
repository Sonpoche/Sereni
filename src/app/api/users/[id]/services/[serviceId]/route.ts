// src/app/api/users/[id]/services/[serviceId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour la mise à jour d'un service
const serviceSchema = z.object({
  name: z.string().min(3, "Le nom du service doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.number().min(5, "La durée minimum est de 5 minutes").max(480, "La durée maximum est de 8 heures"),
  price: z.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().optional(),
  maxParticipants: z.number().default(1),
  type: z.string().optional(),
  location: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, serviceId: string } }
) {
  try {
    const { id: userId, serviceId } = params
    
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
    const validatedData = serviceSchema.parse(body)
    
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
    
    // Vérifier que le service appartient au praticien
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    })
    
    if (!existingService || existingService.professionalId !== professional.id) {
      return NextResponse.json(
        { error: "Service non trouvé ou non autorisé" },
        { status: 404 }
      )
    }
    
    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        duration: validatedData.duration,
        price: validatedData.price,
        color: validatedData.color,
        maxParticipants: validatedData.maxParticipants,
        type: validatedData.type || null,
        location: validatedData.location || null,
      }
    })
    
    return NextResponse.json(updatedService)
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/services/[serviceId]:", error)
    
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
  { params }: { params: { id: string, serviceId: string } }
) {
  try {
    const { id: userId, serviceId } = params
    
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
    
    // Vérifier que le service appartient au praticien
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    })
    
    if (!existingService || existingService.professionalId !== professional.id) {
      return NextResponse.json(
        { error: "Service non trouvé ou non autorisé" },
        { status: 404 }
      )
    }
    
    // Vérifier si le service est utilisé dans des réservations
    const bookingsCount = await prisma.booking.count({
      where: { serviceId }
    })
    
    if (bookingsCount > 0) {
      // Option 1: Désactiver le service au lieu de le supprimer
      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { active: false }
      })
      
      return NextResponse.json(updatedService)
    } else {
      // Option 2: Supprimer le service s'il n'a pas de réservations
      await prisma.service.delete({
        where: { id: serviceId }
      })
      
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/services/[serviceId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}