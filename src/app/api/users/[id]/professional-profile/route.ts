// src/app/api/users/[id]/professional-profile/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { ProfessionalType } from "@prisma/client"

// Schéma de validation pour la mise à jour du profil professionnel
const professionalProfileSchema = z.object({
  type: z.string().min(1, "Le type d'activité est requis"),
  otherTypeDetails: z.string().optional(),
  yearsExperience: z.number().min(0),
  bio: z.string().min(10),
  approach: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().regex(/^\d{5}$/),
  specialties: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
})

// Fonction de mappage simplifiée
const mapToProfessionalType = (type: string): ProfessionalType => {
  const mapping: Record<string, ProfessionalType> = {
    "COACH_VIE": "LIFE_COACH",
    "COACH_SPORTIF": "PERSONAL_COACH",
    "PROF_YOGA": "YOGA_TEACHER",
    "PROF_PILATES": "PILATES_INSTRUCTOR",
    "THERAPEUTE": "THERAPIST",
    "PRATICIEN_MASSAGE": "MASSAGE_THERAPIST",
    "PROF_MEDITATION": "MEDITATION_TEACHER",
    // Par défaut, tout le reste est OTHER
  };
  
  return mapping[type] || "OTHER";
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    console.log(`🟦 [API] Mise à jour du profil professionnel pour ${userId}`)
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      console.log(`🔴 [API] Accès non autorisé: ${session?.user?.id} != ${userId}`)
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer les données
    const body = await request.json()
    console.log(`🟦 [API] Données reçues:`, body)
    
    try {
      // Vérifier si le profil professionnel existe déjà
      const existingProfile = await prisma.professional.findUnique({
        where: { userId }
      })
      
      let updatedProfile
      
      if (existingProfile) {
        console.log(`🟦 [API] Mise à jour d'un profil existant`)
        // Mettre à jour le profil existant
        updatedProfile = await prisma.professional.update({
          where: { userId },
          data: {
            type: mapToProfessionalType(body.type),
            otherTypeDetails: body.otherTypeDetails,
            yearsExperience: body.yearsExperience,
            bio: body.bio,
            description: body.approach,
            address: body.address,
            city: body.city,
            postalCode: body.postalCode,
            specialties: body.specialties,
            certifications: body.certifications
          }
        })
      } else {
        console.log(`🟦 [API] Création d'un nouveau profil`)
        // Créer un nouveau profil
        updatedProfile = await prisma.professional.create({
          data: {
            userId,
            type: mapToProfessionalType(body.type),
            otherTypeDetails: body.otherTypeDetails,
            yearsExperience: body.yearsExperience,
            bio: body.bio,
            description: body.approach,
            address: body.address,
            city: body.city,
            postalCode: body.postalCode,
            specialties: body.specialties,
            certifications: body.certifications,
            autoConfirmBookings: false,
            languages: ["fr"]
          }
        })
        
        // Mettre à jour le flag hasProfile
        await prisma.user.update({
          where: { id: userId },
          data: { hasProfile: true }
        })
      }
      
      console.log(`🟦 [API] Profil mis à jour avec succès`)
      return NextResponse.json(updatedProfile)
    } catch (dbError) {
      console.error(`🔴 [API] Erreur base de données:`, dbError)
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour en base de données", details: String(dbError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(`🔴 [API] Erreur générale:`, error)
    
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