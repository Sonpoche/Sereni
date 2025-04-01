// src/app/api/users/[id]/personal-info/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { UserRole } from "@prisma/client"

// Schéma de validation pour la mise à jour des informations personnelles
const personalInfoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Numéro de téléphone invalide"),
  companyName: z.string().optional(),
  siret: z.string().regex(/^\d{14}$/, "Numéro SIRET invalide").optional().or(z.literal('')),
  website: z.string().url("URL du site web invalide").optional().or(z.literal(''))
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
    const validatedData = personalInfoSchema.parse(body)
    
    // Récupérer l'utilisateur et son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professionalProfile: true,
        clientProfile: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }
    
    // Mettre à jour les données de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
      }
    })
    
    // Mettre à jour le profil selon le rôle
    if (user.role === UserRole.PROFESSIONAL) {
      if (user.professionalProfile) {
        // Mettre à jour le profil professionnel existant
        await prisma.professional.update({
          where: { userId },
          data: {
            phone: validatedData.phone,
            // Ajouter d'autres champs spécifiques aux professionnels
          }
        })
      } else {
        // Créer un nouveau profil professionnel
        await prisma.professional.create({
          data: {
            userId,
            phone: validatedData.phone,
            autoConfirmBookings: false,
            languages: ["fr"],
            type: "OTHER" // Valeur par défaut, devrait être mise à jour par l'utilisateur
          }
        })
      }
    } else if (user.role === UserRole.CLIENT) {
      if (user.clientProfile) {
        // Mettre à jour le profil client existant
        await prisma.client.update({
          where: { userId },
          data: {
            phone: validatedData.phone
          }
        })
      } else {
        // Créer un nouveau profil client
        await prisma.client.create({
          data: {
            userId,
            phone: validatedData.phone,
            preferredLanguage: "fr"
          }
        })
      }
    }
    
    // Construire la réponse en fonction du rôle
    const responseData = {
      ...validatedData,
      id: userId,
      email: user.email
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/personal-info:", error)
    
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