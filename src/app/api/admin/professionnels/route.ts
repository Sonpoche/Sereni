// src/app/api/admin/professionals/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { UserRole } from '@prisma/client'
import { ProfessionalType, apiToProfessionalType } from '@/types/professional'
import { z } from 'zod'

// Schéma de validation pour les filtres
const FiltersSchema = z.object({
  search: z.string().optional(),
  type: z.nativeEnum(ProfessionalType).optional(),
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
    // Vérification de l'authentification et des permissions
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Extraction et validation des paramètres de requête
    const { searchParams } = new URL(request.url)
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
        { email: { contains: filters.search, mode: 'insensitive' } },
        { professionalProfile: { businessName: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    // Filtre par type de professionnel
    if (filters.type) {
      // Convertir le type frontend vers le type DB si nécessaire
      const dbType = Object.entries(apiToProfessionalType).find(
        ([, frontendType]) => frontendType === filters.type
      )?.[0] || filters.type
      
      whereConditions.professionalProfile = {
        ...whereConditions.professionalProfile,
        type: dbType
      }
    }

    // Filtre par statut (ajustez selon votre schéma)
    if (filters.status) {
      const statusMapping = {
        active: true,
        inactive: false,
        pending: null // Profils incomplets
      }
      // Vous devrez ajuster ce champ selon votre schéma User
      // whereConditions.isActive = statusMapping[filters.status]
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
        orderBy = { createdAt: filters.sortOrder }
        break
      case 'clients':
        // Tri par nombre de clients (nécessite une sous-requête)
        orderBy = { appointments: { _count: filters.sortOrder } }
        break
      case 'revenue':
        // Tri par revenus (estimation basée sur les RDV)
        orderBy = { createdAt: filters.sortOrder } // Fallback pour l'instant
        break
      default:
        orderBy = { createdAt: filters.sortOrder }
    }

    // Calcul de la pagination
    const skip = (filters.page - 1) * filters.limit

    // Requête principale avec enrichissement des données
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
                  bookings: {
                    where: {
                      status: { in: ['CONFIRMED', 'COMPLETED'] }
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              // Note: Les bookings sont liés au Professional, pas directement au User
              // Nous devrons utiliser une approche différente pour compter
            }
          }
        },
        orderBy,
        skip,
        take: filters.limit
      }),
      prisma.user.count({ where: whereConditions })
    ])

    // Enrichissement des données avec métriques business
    const enrichedProfessionals = await Promise.all(
      professionals.map(async (professional) => {
        if (!professional.professionalProfile) {
          return null // Skip si pas de profil professionnel
        }

        // Calcul des revenus estimés (basé sur les RDV confirmés/terminés)
        const revenueData = await prisma.booking.aggregate({
          where: {
            professionalId: professional.professionalProfile.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
            }
          },
          _sum: {
            // Note: Utilisation du prix du service lié
          },
          _count: true
        })

        // Calcul du taux de conversion (RDV confirmés vs demandes)
        const [confirmedBookings, totalRequests] = await Promise.all([
          prisma.booking.count({
            where: {
              professionalId: professional.professionalProfile.id,
              status: { in: ['CONFIRMED', 'COMPLETED'] },
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          prisma.booking.count({
            where: {
              professionalId: professional.professionalProfile.id,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          })
        ])

        // Nombre de clients uniques
        const uniqueClients = await prisma.booking.findMany({
          where: {
            professionalId: professional.professionalProfile.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          },
          select: { clientId: true },
          distinct: ['clientId']
        })

        // Calcul du revenu mensuel en récupérant les prix des services
        const bookingsWithServices = await prisma.booking.findMany({
          where: {
            professionalId: professional.professionalProfile.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            service: {
              select: { price: true }
            }
          }
        })

        const monthlyRevenue = bookingsWithServices.reduce((sum, booking) => {
          return sum + (booking.service.price.toNumber() || 0)
        }, 0)

        // Vérification du profil complet
        const isProfileComplete = !!(
          professional.name &&
          professional.email &&
          professional.professionalProfile?.type &&
          professional.professionalProfile?.phone &&
          professional.professionalProfile?.bio &&
          professional.professionalProfile?.services?.length > 0
        )

        return {
          id: professional.id,
          name: professional.name,
          email: professional.email,
          avatar: professional.image, // Dans votre schéma, c'est "image" pas "avatar"
          isActive: true, // Pas de champ active dans votre schéma, donc on assume true
          createdAt: professional.createdAt,
          lastLoginAt: null, // Pas de champ lastLoginAt dans votre schéma
          professional: {
            type: professional.professionalProfile.type,
            businessName: null, // Pas de champ businessName dans Professional
            phone: professional.professionalProfile.phone,
            city: professional.professionalProfile.city,
            subscriptionTier: professional.professionalProfile.subscriptionTier,
            stripeCustomerId: professional.professionalProfile.stripeCustomerId,
            servicesCount: professional.professionalProfile.services?.length || 0,
            services: professional.professionalProfile.services || []
          },
          metrics: {
            totalClients: uniqueClients.length,
            totalBookings: professional.professionalProfile._count.bookings,
            monthlyRevenue,
            monthlyBookings: revenueData._count,
            conversionRate: totalRequests > 0 ? (confirmedBookings / totalRequests) * 100 : 0,
            isProfileComplete
          }
        }
      })
    )

    // Filter out null values (users without professional profiles)
    const validProfessionals = enrichedProfessionals.filter(Boolean)

    // Métadonnées de pagination
    const totalPages = Math.ceil(totalCount / filters.limit)
    const hasNextPage = filters.page < totalPages
    const hasPrevPage = filters.page > 1

    return NextResponse.json({
      professionals: validProfessionals,
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
    })

  } catch (error) {
    console.error('❌ [Admin/Professionals] Erreur lors de la récupération:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres de requête invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}