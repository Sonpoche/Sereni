// src/app/api/users/[id]/services/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour la création/mise à jour d'un service
const serviceSchema = z.object({
  name: z.string().min(3, "Le nom du service doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.number().min(5, "La durée minimum est de 5 minutes").max(480, "La durée maximum est de 8 heures"),
  price: z.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().optional(),
  maxParticipants: z.number().int().min(1, "Au moins 1 participant est requis"),
  location: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Vérifier si l'utilisateur a un profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer tous les services du praticien
    const services = await prisma.service.findMany({
      where: { professionalId: professional.id },
      orderBy: { name: "asc" }
    })
    
    return NextResponse.json(services)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/services:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer les données
    const body = await request.json()
    console.log("Données brutes reçues à l'API:", body)
    
    // Valider les données
    try {
      // S'assurer que tous les champs numériques sont bien des nombres
      const preparedData = {
        ...body,
        duration: typeof body.duration === 'string' ? parseInt(body.duration) : body.duration,
        price: typeof body.price === 'string' ? parseFloat(body.price) : body.price,
        maxParticipants: typeof body.maxParticipants === 'string' ? 
          parseInt(body.maxParticipants) : 
          body.maxParticipants
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
      
      // Créer le service
      const service = await prisma.service.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          duration: validatedData.duration,
          price: validatedData.price,
          color: validatedData.color,
          maxParticipants: validatedData.maxParticipants,
          location: validatedData.location,
          professionalId: professional.id,
          active: true
        }
      })
      
      return NextResponse.json(service)
    } catch (validationError) {
      console.error("Erreur de validation:", validationError)
      
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides", details: validationError.errors },
          { status: 400 }
        )
      }
      
      throw validationError
    }
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/services:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: String(error) },
      { status: 500 }
    )
  }
}