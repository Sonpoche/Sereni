// src/app/api/users/[id]/cours-collectifs/[classId]/route.ts
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

// PATCH - Modifier un cours collectif
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; classId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = groupClassSchema.parse(body)

    // Vérifier que le cours appartient bien au professionnel
    const groupClass = await prisma.groupClass.findFirst({
      where: {
        id: params.classId,
        professional: { userId: session.user.id }
      }
    })

    if (!groupClass) {
      return NextResponse.json({ error: "Cours collectif non trouvé" }, { status: 404 })
    }

    // Géocoder l'adresse si c'est un cours présentiel
    let latitude = groupClass.latitude
    let longitude = groupClass.longitude
    
    if (!data.isOnline && data.city) {
      const coords = await geocodeAddress(`${data.address || ''} ${data.city}, ${data.postalCode || ''} France`)
      if (coords) {
        latitude = coords.latitude
        longitude = coords.longitude
      }
    }

    // Mettre à jour le cours collectif
    const updatedGroupClass = await prisma.groupClass.update({
      where: { id: params.classId },
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
      groupClass: updatedGroupClass
    })

  } catch (error) {
    console.error("Erreur lors de la modification du cours collectif:", error)
    
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

// DELETE - Supprimer un cours collectif
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; classId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log(`🗑️ Tentative de suppression du cours ${params.classId} par l'utilisateur ${params.id}`)

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Vérifier que le cours appartient bien au professionnel
    const groupClass = await prisma.groupClass.findFirst({
      where: {
        id: params.classId,
        professionalId: professional.id
      },
      include: {
        sessions: {
          include: {
            registrations: true
          }
        }
      }
    })

    if (!groupClass) {
      console.log(`❌ Cours collectif ${params.classId} non trouvé pour le professionnel ${professional.id}`)
      return NextResponse.json({ error: "Cours collectif non trouvé" }, { status: 404 })
    }

    console.log(`✅ Cours collectif trouvé: ${groupClass.name}`)

    // Vérifier s'il y a des inscriptions actives
    const activeRegistrations = groupClass.sessions.reduce((total, session) => {
      return total + session.registrations.filter(reg => reg.status !== 'CANCELLED').length
    }, 0)

    if (activeRegistrations > 0) {
      return NextResponse.json({ 
        error: "Impossible de supprimer ce cours collectif car il y a des inscriptions actives" 
      }, { status: 409 })
    }

    // Supprimer le cours collectif (les sessions et inscriptions seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.groupClass.delete({
      where: { id: params.classId }
    })

    console.log(`✅ Cours collectif ${params.classId} supprimé avec succès`)

    return NextResponse.json({
      success: true,
      message: "Cours collectif supprimé avec succès"
    })

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du cours collectif:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}