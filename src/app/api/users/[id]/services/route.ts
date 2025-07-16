// src/app/api/users/[id]/services/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"

// Schéma de validation simplifié (sans cours collectifs)
const serviceSchema = z.object({
  name: z.string().min(3, "Le nom du service doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.coerce.number().min(5, "La durée minimum est de 5 minutes").max(480, "La durée maximum est de 8 heures"),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().default("#6746c3"),
  location: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: id }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Récupérer les services (filtrés pour exclure les anciens services de groupe)
    const services = await prisma.service.findMany({
      where: { 
        professionalId: professional.id,
        active: true
      },
      orderBy: { name: 'asc' }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = serviceSchema.parse(body)

    console.log("Données reçues pour création de service:", validatedData)

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: id }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Créer le service (sans options de cours collectifs)
    const service = await prisma.service.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        duration: validatedData.duration,
        price: validatedData.price,
        color: validatedData.color,
        location: validatedData.location,
        active: true,
        professionalId: professional.id,
        // Supprimer les anciens champs de cours collectifs
        // isGroupService: false par défaut
        // maxParticipants: 1 par défaut
      }
    })

    console.log("Service créé:", service)

    return NextResponse.json(service)
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/services:", error)
    
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

// Fonction utilitaire pour nettoyer les anciens services de groupe
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "cleanup_group_services") {
      // Récupérer le profil professionnel
      const professional = await prisma.professional.findUnique({
        where: { userId: id }
      })

      if (!professional) {
        return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
      }

      // Désactiver tous les anciens services de groupe
      const updatedServices = await prisma.service.updateMany({
        where: {
          professionalId: professional.id,
          // Chercher les services qui étaient marqués comme groupe
          OR: [
            { name: { contains: "Cours collectif" } },
            { description: { contains: "groupe" } },
            { description: { contains: "collectif" } }
          ]
        },
        data: {
          active: false
        }
      })

      return NextResponse.json({
        message: "Services de groupe nettoyés avec succès",
        updatedCount: updatedServices.count
      })
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/services:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}