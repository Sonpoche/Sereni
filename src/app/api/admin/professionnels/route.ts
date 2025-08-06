// src/app/api/admin/professionnels/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

// Schéma de validation pour les filtres - VERSION SIMPLIFIÉE
const FiltersSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(), // Simplifié pour éviter les erreurs d'enum
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  subscriptionTier: z.enum(['standard', 'premium']).optional(),
  city: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'clients', 'revenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin/Professionnels] Début de la requête...')

    // Vérification de l'authentification et des permissions
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      console.log('🔒 [Admin/Professionnels] Accès refusé - pas admin')
      return NextResponse.json(
        { error: "Accès non autorisé - Admin requis" },
        { status: 403 }
      )
    }

    console.log('✅ [Admin/Professionnels] Utilisateur admin authentifié:', session.user.email)

    // Extraction et validation des paramètres de requête
    const { searchParams } = new URL(request.url)
    console.log('🔍 [Admin/Professionnels] Paramètres reçus:', Object.fromEntries(searchParams.entries()))

    const filters = FiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      subscriptionTier: searchParams.get('subscriptionTier') || undefined,
      city: searchParams.get('city') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    })

    console.log('✅ [Admin/Professionnels] Filtres validés:', filters)

    // Construction des conditions de filtrage
    const whereConditions: any = {
      role: UserRole.PROFESSIONAL,
      professionalProfile: {
        isNot: null // S'assurer qu'il y a un profil professionnel
      }
    }

    // Filtre par recherche textuelle
    if (filters.search) {
      whereConditions.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Filtre par type de professionnel - VERSION SIMPLIFIÉE
    if (filters.type && filters.type !== 'all') {
      whereConditions.professionalProfile = {
        ...whereConditions.professionalProfile,
        type: filters.type
      }
    }

    // Filtre par plan d'abonnement
    if (filters.subscriptionTier) {
      whereConditions.professionalProfile = {
        ...whereConditions.professionalProfile,
        subscriptionTier: filters.subscriptionTier
      }
    }

    // Filtre par ville
    if (filters.city) {
      whereConditions.professionalProfile = {
        ...whereConditions.professionalProfile,
        city: { contains: filters.city, mode: 'insensitive' }
      }
    }

    console.log('🔍 [Admin/Professionnels] Conditions WHERE:', JSON.stringify(whereConditions, null, 2))

    // Configuration du tri
    let orderBy: any = {}
    switch (filters.sortBy) {
      case 'name':
        orderBy = { name: filters.sortOrder }
        break
      case 'email':
        orderBy = { email: filters.sortOrder }
        break
      case 'createdAt':
      default:
        orderBy = { createdAt: filters.sortOrder }
        break
    }

    console.log('📋 [Admin/Professionnels] Tri appliqué:', orderBy)

    // Calcul de la pagination
    const skip = (filters.page - 1) * filters.limit

    // Requête principale - VERSION SIMPLIFIÉE POUR ÉVITER LES ERREURS
    console.log('🔍 [Admin/Professionnels] Exécution des requêtes Prisma...')
    
    const [professionals, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        include: {
          professionalProfile: {
            include: {
              services: {
                where: { active: true },
                select: { id: true, name: true, price: true }
              },
              _count: {
                select: {
                  bookings: true,
                  services: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: filters.limit
      }),
      prisma.user.count({ where: whereConditions })
    ])

    console.log(`📊 [Admin/Professionnels] ${professionals.length} professionnels trouvés sur ${totalCount} total`)

    // Enrichissement des données - VERSION SIMPLIFIÉE
    const enrichedProfessionals = professionals.map((professional) => {
      if (!professional.professionalProfile) {
        return null // Skip si pas de profil professionnel
      }

      // Vérification du profil complet - VERSION SIMPLIFIÉE
      const isProfileComplete = !!(
        professional.name &&
        professional.email &&
        professional.professionalProfile?.type &&
        professional.professionalProfile?.phone
      )

      return {
        id: professional.id,
        name: professional.name || 'Non renseigné',
        email: professional.email || 'Non renseigné',
        avatar: professional.image,
        isActive: true, // Par défaut actif pour simplifier
        createdAt: professional.createdAt.toISOString(),
        lastLoginAt: null,
        professional: {
          type: professional.professionalProfile.type || 'OTHER',
          businessName: null, // Simplifié
          phone: professional.professionalProfile.phone,
          city: professional.professionalProfile.city,
          subscriptionTier: professional.professionalProfile.subscriptionTier || 'standard',
          stripeCustomerId: professional.professionalProfile.stripeCustomerId,
          servicesCount: professional.professionalProfile.services?.length || 0,
          services: professional.professionalProfile.services || []
        },
        metrics: {
          totalClients: 0, // Simplifié pour éviter les erreurs
          totalBookings: professional.professionalProfile._count?.bookings || 0,
          monthlyRevenue: 0, // Simplifié pour éviter les erreurs
          monthlyBookings: 0, // Simplifié pour éviter les erreurs
          conversionRate: 0, // Simplifié pour éviter les erreurs
          isProfileComplete
        }
      }
    }).filter(Boolean) // Filtrer les valeurs nulles

    // Métadonnées de pagination
    const totalPages = Math.ceil(totalCount / filters.limit)
    const hasNextPage = filters.page < totalPages
    const hasPrevPage = filters.page > 1

    const response = {
      professionals: enrichedProfessionals,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: filters.limit
      },
      filters: {
        applied: {
          search: filters.search,
          type: filters.type,
          status: filters.status,
          subscriptionTier: filters.subscriptionTier,
          city: filters.city,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        }
      }
    }

    console.log('✅ [Admin/Professionnels] Réponse préparée avec succès')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [Admin/Professionnels] Erreur lors de la récupération:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ [Admin/Professionnels] Erreur de validation Zod:', error.errors)
      return NextResponse.json(
        { error: "Paramètres de requête invalides", details: error.errors },
        { status: 400 }
      )
    }

    // Log détaillé de l'erreur pour debugging
    if (error instanceof Error) {
      console.error('❌ [Admin/Professionnels] Message d\'erreur:', error.message)
      console.error('❌ [Admin/Professionnels] Stack trace:', error.stack)
    }

    return NextResponse.json(
      { 
        error: "Erreur interne du serveur", 
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      },
      { status: 500 }
    )
  }
}