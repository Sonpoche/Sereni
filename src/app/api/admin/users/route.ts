// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { sendWelcomeEmail } from "@/lib/emails/welcome"

// Schema de validation pour création d'utilisateur
const createUserSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN']),
  sendWelcomeEmail: z.boolean().optional().default(true)
})

// GET - Récupérer la liste des utilisateurs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Vérifier l'authentification admin
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construire les conditions de filtre
    let whereCondition: any = {}

    if (role && role !== 'all') {
      whereCondition.role = role as UserRole
    }

    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          whereCondition.hasProfile = true
          whereCondition.emailVerified = { not: null }
          break
        case 'incomplete':
          whereCondition.hasProfile = false
          break
        case 'unverified':
          whereCondition.emailVerified = null
          break
      }
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Récupérer les utilisateurs avec relations selon votre schéma réel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        include: {
          subscription: {
            select: {
              id: true,
              plan: true,
              status: true
            }
          },
          professionalProfile: {
            select: {
              id: true,
              type: true,
              city: true,
              services: {
                select: {
                  id: true
                }
              },
              bookings: {
                select: {
                  id: true
                }
              }
            }
          },
          clientProfile: {
            select: {
              id: true,
              bookings: {
                select: {
                  id: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where: whereCondition })
    ])

    // Formater les données pour le frontend
    const formattedUsers = users.map(user => ({
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
        mrr: user.subscription.plan === 'premium' ? 40 : 20
      } : undefined,
      professionalProfile: user.professionalProfile ? {
        id: user.professionalProfile.id,
        type: user.professionalProfile.type,
        city: user.professionalProfile.city || 'Non renseigné',
        servicesCount: user.professionalProfile.services.length,
        bookingsCount: user.professionalProfile.bookings.length
      } : undefined,
      clientProfile: user.clientProfile ? {
        id: user.clientProfile.id,
        bookingsCount: user.clientProfile.bookings.length
      } : undefined
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur récupération utilisateurs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Vérifier l'authentification admin
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Créer l'utilisateur et son profil selon le rôle
    const newUser = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role as UserRole,
          hasProfile: false, // L'utilisateur devra compléter son profil
          emailVerified: null // L'utilisateur devra vérifier son email
        }
      })

      // Créer le profil selon le rôle
      if (validatedData.role === 'PROFESSIONAL') {
        await tx.professional.create({
          data: {
            userId: user.id,
            type: 'OTHER', // Valeur par défaut, à compléter
            languages: ['fr'],
            subscriptionTier: 'standard'
          }
        })
      } else if (validatedData.role === 'CLIENT') {
        await tx.client.create({
          data: {
            userId: user.id,
            preferredLanguage: 'fr'
          }
        })
      }

      return user
    })

    // Envoyer l'email de bienvenue si demandé
    if (validatedData.sendWelcomeEmail) {
      try {
        await sendWelcomeEmail({
          email: newUser.email!,
          name: newUser.name!,
          tempPassword,
          loginUrl: `${process.env.NEXTAUTH_URL}/connexion`
        })
      } catch (emailError) {
        console.error('❌ Erreur envoi email:', emailError)
        // Ne pas faire échouer la création si l'email ne peut pas être envoyé
      }
    }

    console.log(`✅ [Admin] Utilisateur créé: ${newUser.email} (${newUser.role})`)

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tempPassword: validatedData.sendWelcomeEmail ? undefined : tempPassword
      }
    })

  } catch (error) {
    console.error("❌ [Admin] Erreur création utilisateur:", error)
    
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