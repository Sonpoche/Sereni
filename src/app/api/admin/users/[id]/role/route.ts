// src/app/api/admin/users/[id]/role/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"
import { z } from "zod"

// Schema de validation pour changement de rôle
const changeRoleSchema = z.object({
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Vérifier l'authentification admin
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 401 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const validatedData = changeRoleSchema.parse(body)

    // Empêcher la modification de son propre rôle
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur actuel
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, name: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Si c'est le dernier admin, empêcher le changement
    if (existingUser.role === 'ADMIN' && validatedData.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Impossible de modifier le rôle du dernier administrateur" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        role: validatedData.role as UserRole,
        // Si on change vers CLIENT ou PROFESSIONAL, marquer le profil comme incomplet
        // car il faudra compléter les informations spécifiques au rôle
        hasProfile: validatedData.role === 'ADMIN' ? true : false
      }
    })

    // Si changement vers PROFESSIONAL, créer le profil professionnel de base
    if (validatedData.role === 'PROFESSIONAL' && existingUser.role !== 'PROFESSIONAL') {
      try {
        await prisma.professional.create({
          data: {
            userId: userId,
            type: 'OTHER', // Valeur par défaut, à compléter
            specialties: [],
            languages: ['fr'],
            subscriptionTier: 'standard'
          }
        })
      } catch (professionalError) {
        // Profil professionnel existe peut-être déjà, ignorer l'erreur
        console.log("Profil professionnel existe déjà ou erreur:", professionalError)
      }
    }

    // Si changement vers CLIENT, créer le profil client de base
    if (validatedData.role === 'CLIENT' && existingUser.role !== 'CLIENT') {
      try {
        await prisma.client.create({
          data: {
            userId: userId,
            preferredLanguage: 'fr'
          }
        })
      } catch (clientError) {
        // Profil client existe peut-être déjà, ignorer l'erreur
        console.log("Profil client existe déjà ou erreur:", clientError)
      }
    }

    // Log de l'action
    console.log(`✅ [Admin] Rôle modifié: ${existingUser.email} ${existingUser.role} -> ${validatedData.role} par ${session.user.email}`)

    // Envoyer notification à l'utilisateur (simulation)
    console.log(`
📧 EMAIL ENVOYÉ À ${existingUser.email}:

Sujet: Modification de votre rôle SereniBook

Bonjour ${existingUser.name || ''},

Votre rôle sur SereniBook a été modifié par un administrateur.

Nouveau rôle : ${validatedData.role === 'ADMIN' ? 'Administrateur' : 
                validatedData.role === 'PROFESSIONAL' ? 'Professionnel' : 'Client'}

${validatedData.role !== 'ADMIN' ? 'Vous devrez compléter votre profil lors de votre prochaine connexion.' : ''}

Si vous avez des questions, n'hésitez pas à nous contacter.

L'équipe SereniBook
    `)

    return NextResponse.json({
      success: true,
      message: "Rôle mis à jour avec succès",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        hasProfile: updatedUser.hasProfile
      }
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur changement rôle:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Données invalides", 
          details: error.errors.map(e => e.message) 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}