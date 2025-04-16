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
  maxParticipants: z.number().int().min(1, "Au moins 1 participant est requis"),
  location: z.string().optional().nullable(),
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
    console.log("Données brutes de modification:", body)
    
    try {
      // S'assurer que tous les champs numériques sont bien des nombres
      const preparedData = {
        ...body,
        duration: typeof body.duration === 'string' ? parseInt(body.duration) : body.duration,
        price: typeof body.price === 'string' ? parseFloat(body.price) : body.price,
        maxParticipants: typeof body.maxParticipants === 'string' ? 
          parseInt(body.maxParticipants) : 
          body.maxParticipants,
        // Convertir null en chaîne vide si nécessaire
        location: body.location === null ? "" : body.location
      };
      
      console.log("Données préparées pour validation:", preparedData);
      
      const validatedData = serviceSchema.parse(preparedData);
      console.log("Données validées:", validatedData);
      
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
          location: validatedData.location,
        }
      })
      
      return NextResponse.json(updatedService)
    } catch (validationError) {
      console.error("Erreur de validation PATCH:", validationError)
      
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides", details: validationError.errors },
          { status: 400 }
        )
      }
      
      throw validationError
    }
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