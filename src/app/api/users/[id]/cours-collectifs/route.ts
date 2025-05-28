// src/app/api/users/[id]/cours-collectifs/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { geocodeAddress } from "@/lib/utils/geocoding"

const groupClassSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: z.number().min(0, "Le prix doit être positif"),
  duration: z.number().min(15, "La durée minimum est de 15 minutes"),
  maxParticipants: z.number().min(2, "Au moins 2 participants requis").max(50, "Maximum 50 participants"),
  category: z.string().min(1, "Sélectionnez une catégorie"),
  level: z.string().optional(),
  isOnline: z.boolean(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  equipment: z.array(z.string()).default([]),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un professionnel
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Seuls les professionnels peuvent créer des cours" }, { status: 403 })
    }

    const body = await request.json()
    const data = groupClassSchema.parse(body)

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Géocoder l'adresse si c'est un cours présentiel
    let latitude = null
    let longitude = null
    
    if (!data.isOnline && data.city) {
      const coords = await geocodeAddress(`${data.address || ''} ${data.city}, ${data.postalCode || ''} France`)
      if (coords) {
        latitude = coords.latitude
        longitude = coords.longitude
      }
    }

    // Créer le cours collectif
    const groupClass = await prisma.groupClass.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        maxParticipants: data.maxParticipants,
        category: data.category,
        level: data.level,
        isOnline: data.isOnline,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        latitude,
        longitude,
        equipment: data.equipment,
        professionalId: professional.id,
        active: true
      },
      include: {
        sessions: {
          include: {
            registrations: {
              select: { id: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      groupClass
    })

  } catch (error) {
    console.error("Erreur lors de la création du cours collectif:", error)
    
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Récupérer tous les cours collectifs du professionnel
    const groupClasses = await prisma.groupClass.findMany({
      where: { professionalId: professional.id },
      include: {
        sessions: {
          include: {
            registrations: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(groupClasses)

  } catch (error) {
    console.error("Erreur lors de la récupération des cours collectifs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}