// src/app/api/admin/professionnels/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

// Schéma pour les actions admin
const AdminActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'validate', 'suspend', 'update_notes']),
  reason: z.string().optional(),
  notes: z.string().optional(),
  duration: z.number().optional() // Pour les suspensions temporaires (en jours)
})

// Types TypeScript pour éviter les erreurs
interface BookingWithDetails {
  id: string
  startTime: Date
  endTime: Date
  status: string
  notes: string | null
  cancellationReason: string | null
  client: {
    id: string
    user: {
      id: string
      name: string | null
      email: string | null
    }
  } | null
  service: {
    id: string
    name: string
    price: any // Decimal type de Prisma
  }
}

interface Metrics {
  totalRevenue: number
  totalClients: number
  totalBookings: number
  averageSessionsPerClient: number
  revenueByMonth: any[]
  bookingsByStatus: any[]
  topClients: any[]
}

interface Props {
  params: {
    id: string
  }
}

// GET - Récupérer les détails d'un professionnel
export async function GET(request: NextRequest, { params }: Props) {
  try {
    console.log('🔍 [Admin/Professionnel Details] Récupération des détails pour:', params.id)

    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      console.log('🔒 [Admin/Professionnel Details] Accès refusé - pas admin')
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    const professional = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: UserRole.PROFESSIONAL
      },
      include: {
        professionalProfile: {
          include: {
            services: {
              include: {
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
            availability: true,
            _count: {
              select: {
                bookings: true,
                services: true
              }
            }
          }
        },
        subscription: true
      }
    })

    if (!professional || !professional.professionalProfile) {
      console.log('❌ [Admin/Professionnel Details] Professionnel non trouvé:', params.id)
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer les bookings récents avec typage correct
    let bookings: BookingWithDetails[] = []
    try {
      const rawBookings = await prisma.booking.findMany({
        where: { professionalId: professional.professionalProfile.id },
        include: {
          client: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          service: {
            select: { id: true, name: true, price: true }
          }
        },
        orderBy: { startTime: 'desc' },
        take: 10
      })

      // Transformation avec typage explicite
      bookings = rawBookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        cancellationReason: booking.cancellationReason,
        client: booking.client ? {
          id: booking.client.id,
          user: {
            id: booking.client.user.id,
            name: booking.client.user.name,
            email: booking.client.user.email
          }
        } : null,
        service: {
          id: booking.service.id,
          name: booking.service.name,
          price: booking.service.price
        }
      }))
    } catch (error) {
      console.error('⚠️ [Admin/Professionnel Details] Erreur récupération bookings:', error)
      bookings = []
    }

    // Métriques avec typage correct
    const metrics: Metrics = {
      totalRevenue: 0, // Calculé plus tard si nécessaire
      totalClients: 0, // Calculé plus tard si nécessaire
      totalBookings: professional.professionalProfile._count?.bookings || 0,
      averageSessionsPerClient: 0, // Calculé plus tard si nécessaire
      revenueByMonth: [], // Simplifié pour l'instant
      bookingsByStatus: [], // Simplifié pour l'instant
      topClients: [] // Simplifié pour l'instant
    }

    console.log('✅ [Admin/Professionnel Details] Détails récupérés avec succès')

    return NextResponse.json({
      professional: {
        ...professional,
        bookings,
        metrics
      }
    })

  } catch (error) {
    console.error('❌ [Admin/Professionnel Details] Erreur:', error)
    
    if (error instanceof Error) {
      console.error('❌ [Admin/Professionnel Details] Message d\'erreur:', error.message)
      console.error('❌ [Admin/Professionnel Details] Stack trace:', error.stack)
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

// POST - Actions administratives  
export async function POST(request: NextRequest, { params }: Props) {
  try {
    console.log('🔧 [Admin/Professionnel Action] Action demandée pour:', params.id)

    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      console.log('🔒 [Admin/Professionnel Action] Accès refusé - pas admin')
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, reason, notes, duration } = AdminActionSchema.parse(body)

    console.log('🔧 [Admin/Professionnel Action] Action:', action, 'Raison:', reason)

    // Vérifier que le professionnel existe
    const professional = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: UserRole.PROFESSIONAL
      },
      include: {
        professionalProfile: true
      }
    })

    if (!professional || !professional.professionalProfile) {
      console.log('❌ [Admin/Professionnel Action] Professionnel non trouvé:', params.id)
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    const result = professional
    let logAction = ''
    let logDetails = ''

    switch (action) {
      case 'activate':
        logAction = 'Compte activé'
        logDetails = reason || 'Activation manuelle par admin'
        break

      case 'deactivate':
        logAction = 'Compte désactivé'
        logDetails = reason || 'Désactivation manuelle par admin'
        break

      case 'validate':
        logAction = 'Profil validé'
        logDetails = reason || 'Validation manuelle du profil professionnel'
        break

      case 'suspend':
        logAction = 'Compte suspendu'
        logDetails = `${reason || 'Suspension administrative'}${duration ? ` - ${duration} jours` : ' - durée indéterminée'}`
        break

      case 'update_notes':
        logAction = 'Notes administratives mises à jour'
        logDetails = 'Modification des notes internes'
        break

      default:
        console.log('❌ [Admin/Professionnel Action] Action non valide:', action)
        return NextResponse.json(
          { error: "Action non valide" },
          { status: 400 }
        )
    }

    // Log de l'action
    console.log(`🔧 [Admin/Professionnel Action] ${logAction}:`, {
      professionalId: params.id,
      adminId: session.user.id,
      action,
      reason,
      details: logDetails,
      timestamp: new Date().toISOString()
    })

    // Si suspension ou désactivation, annuler les RDV futurs
    let affectedBookings = 0
    if (action === 'suspend' || action === 'deactivate') {
      try {
        const updateResult = await prisma.booking.updateMany({
          where: {
            professionalId: professional.professionalProfile.id,
            startTime: { gt: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          data: {
            status: 'CANCELLED',
            cancellationReason: `Compte ${action === 'suspend' ? 'suspendu' : 'désactivé'} par l'administration`
          }
        })

        affectedBookings = updateResult.count
        logDetails += ` - ${affectedBookings} RDV futurs annulés`
        console.log(`✅ [Admin/Professionnel Action] ${affectedBookings} RDV annulés`)
      } catch (error) {
        console.error('⚠️ [Admin/Professionnel Action] Erreur annulation RDV:', error)
      }
    }

    console.log('✅ [Admin/Professionnel Action] Action terminée avec succès')

    return NextResponse.json({
      success: true,
      message: `Action "${logAction}" effectuée avec succès`,
      data: result,
      meta: {
        affectedBookings: affectedBookings > 0,
        bookingsCancelled: affectedBookings
      }
    })

  } catch (error) {
    console.error('❌ [Admin/Professionnel Action] Erreur:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ [Admin/Professionnel Action] Erreur validation Zod:', error.errors)
      return NextResponse.json(
        { error: "Données d'action invalides", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      console.error('❌ [Admin/Professionnel Action] Message d\'erreur:', error.message)
      console.error('❌ [Admin/Professionnel Action] Stack trace:', error.stack)
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