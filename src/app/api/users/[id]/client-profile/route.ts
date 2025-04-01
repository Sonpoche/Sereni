// src/app/api/users/[id]/client-profile/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour la mise à jour du profil client
const clientProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Numéro de téléphone invalide"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
})

export async function PATCH(
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
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = clientProfileSchema.parse(body)
    
    // Mise à jour du nom de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name
      }
    })
    
    // Vérifier si le profil client existe déjà
    const existingProfile = await prisma.client.findUnique({
      where: { userId }
    })
    
    let clientProfile
    
    if (existingProfile) {
      // Mettre à jour le profil client existant
      clientProfile = await prisma.client.update({
        where: { userId },
        data: {
          phone: validatedData.phone,
          address: validatedData.address,
          city: validatedData.city,
          postalCode: validatedData.postalCode
        }
      })
    } else {
      // Créer un nouveau profil client
      clientProfile = await prisma.client.create({
        data: {
          userId,
          phone: validatedData.phone,
          address: validatedData.address,
          city: validatedData.city,
          postalCode: validatedData.postalCode,
          preferredLanguage: "fr"
        }
      })
      
      // Mettre à jour le flag hasProfile si nécessaire
      if (!session.user.hasProfile) {
        await prisma.user.update({
          where: { id: userId },
          data: { hasProfile: true }
        })
      }
    }
    
    return NextResponse.json({
      ...clientProfile,
      name: validatedData.name
    })
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/client-profile:", error)
    
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