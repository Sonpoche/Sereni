// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"
import { z } from "zod"

// Schema de validation pour mise à jour d'utilisateur
const updateUserSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  email: z.string().email("Email invalide").optional(),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN']).optional(),
  hasProfile: z.boolean().optional(),
  emailVerified: z.boolean().optional()
})

// GET - Récupérer un utilisateur spécifique
export async function GET(
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

    // Récupérer l'utilisateur avec toutes les relations selon votre schéma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            cancelationRequests: {
              where: { status: 'pending' },
              orderBy: { requestedAt: 'desc' },
              take: 1
            }
          }
        },
        professionalProfile: {
          include: {
            services: {
              select: {
                id: true,
                name: true,
                price: true,
                active: true
              }
            },
            bookings: {
              select: {
                id: true,
                startTime: true,
                status: true,
                client: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              },
              orderBy: { startTime: 'desc' },
              take: 10
            },
            invoices: {
              select: {
                id: true,
                // Supprimer invoiceNumber car il n'existe pas dans votre schéma
                amount: true,
                status: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        clientProfile: {
          include: {
            bookings: {
              select: {
                id: true,
                startTime: true,
                status: true,
                professional: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              },
              orderBy: { startTime: 'desc' },
              take: 10
            },
            invoices: {
              select: {
                id: true,
                // Supprimer invoiceNumber car il n'existe pas dans votre schéma
                amount: true,
                status: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Formater les données pour le frontend selon les vraies relations
    const formattedUser = {
      id: user.id,
      name: user.name || 'Non renseigné',
      email: user.email || 'Non renseigné',
      role: user.role,
      hasProfile: user.hasProfile,
      emailVerified: user.emailVerified?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      subscription: user.subscription ? {
        id: user.subscription.id,
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodStart: user.subscription.currentPeriodStart?.toISOString(),
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        mrr: user.subscription.plan === 'premium' ? 40 : 20,
        hasPendingCancelation: user.subscription.cancelationRequests.length > 0
      } : null,
      professionalProfile: user.professionalProfile ? {
        id: user.professionalProfile.id,
        type: user.professionalProfile.type,
        city: user.professionalProfile.city,
        address: user.professionalProfile.address,
        bio: user.professionalProfile.bio,
        services: user.professionalProfile.services,
        recentBookings: user.professionalProfile.bookings,
        recentInvoices: user.professionalProfile.invoices,
        stats: {
          totalServices: user.professionalProfile.services.length,
          activeServices: user.professionalProfile.services.filter((s: any) => s.active).length,
          totalBookings: user.professionalProfile.bookings.length,
          totalInvoices: user.professionalProfile.invoices.length
        }
      } : null,
      clientProfile: user.clientProfile ? {
        id: user.clientProfile.id,
        address: user.clientProfile.address,
        city: user.clientProfile.city,
        recentBookings: user.clientProfile.bookings,
        recentInvoices: user.clientProfile.invoices,
        stats: {
          totalBookings: user.clientProfile.bookings.length,
          totalInvoices: user.clientProfile.invoices.length
        }
      } : null
    }

    return NextResponse.json({
      success: true,
      user: formattedUser
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur récupération utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PATCH - Mise à jour d'un utilisateur
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
    const validatedData = updateUserSchema.parse(body)

    // Empêcher la modification du propre compte admin
    if (userId === session.user.id && validatedData.role && validatedData.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier l'unicité de l'email si modifié
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        )
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}

    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.role) updateData.role = validatedData.role as UserRole
    if (typeof validatedData.hasProfile === 'boolean') updateData.hasProfile = validatedData.hasProfile
    if (typeof validatedData.emailVerified === 'boolean') {
      updateData.emailVerified = validatedData.emailVerified ? new Date() : null
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    console.log(`✅ [Admin] Utilisateur mis à jour: ${updatedUser.email} par ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        hasProfile: updatedUser.hasProfile,
        emailVerified: updatedUser.emailVerified?.toISOString() || null
      }
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur mise à jour utilisateur:", error)
    
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

// DELETE - Supprimer un utilisateur
export async function DELETE(
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

    // Empêcher la suppression de son propre compte
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Empêcher la suppression du dernier admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Impossible de supprimer le dernier administrateur" },
          { status: 400 }
        )
      }
    }

    // Supprimer l'utilisateur (les relations sont supprimées automatiquement grâce aux cascades)
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log(`✅ [Admin] Utilisateur supprimé: ${existingUser.email} par ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès"
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur suppression utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}