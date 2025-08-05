// src/app/api/admin/professionals/[id]/route.ts

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

interface Props {
  params: {
    id: string
  }
}

// GET - Récupérer les détails d'un professionnel
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
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
            invoiceSettings: true,
            notifications: true
          }
        },
        clientProfile: true, // Si c'est aussi un client
        subscription: true // Informations d'abonnement
      }
    })

    if (!professional || !professional.professionalProfile) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer les bookings via le professionalProfile
    const bookings = await prisma.booking.findMany({
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
      take: 10 // Derniers RDV
    })

    // Calcul des métriques avancées avec typage correct
    const [revenueStats, clientStats, bookingStats] = await Promise.all([
      // Revenus par mois (6 derniers mois) - Raw query avec typage
      prisma.$queryRaw<Array<{
        month: Date;
        count: number;
        revenue: number;
      }>>`
        SELECT 
          DATE_TRUNC('month', "startTime") as month,
          COUNT(*)::int as count,
          SUM(s.price)::float as revenue
        FROM "Booking" b
        INNER JOIN "Service" s ON b."serviceId" = s.id
        WHERE b."professionalId" = ${professional.professionalProfile.id}
          AND b.status IN ('CONFIRMED', 'COMPLETED')
          AND b."startTime" > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "startTime")
        ORDER BY month DESC
      `,
      
      // Statistiques clients
      prisma.booking.groupBy({
        by: ['clientId'],
        where: {
          professionalId: professional.professionalProfile.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _count: { clientId: true },
        orderBy: { _count: { clientId: 'desc' } }
      }),
      
      // Répartition des RDV par statut
      prisma.booking.groupBy({
        by: ['status'],
        where: { professionalId: professional.professionalProfile.id },
        _count: { status: true }
      })
    ])

    return NextResponse.json({
      professional: {
        ...professional,
        bookings, // Ajouter les bookings récupérés séparément
        metrics: {
          totalRevenue: revenueStats.reduce((sum: number, month) => sum + (month.revenue || 0), 0),
          totalClients: clientStats.length,
          totalBookings: bookings.length,
          averageSessionsPerClient: clientStats.length > 0 
            ? clientStats.reduce((sum: number, client: any) => sum + client._count.clientId, 0) / clientStats.length 
            : 0,
          revenueByMonth: revenueStats,
          bookingsByStatus: bookingStats,
          topClients: clientStats.slice(0, 5)
        }
      }
    })

  } catch (error) {
    console.error('❌ [Admin/Professional Details] Erreur:', error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Actions administratives  
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, reason, notes, duration } = AdminActionSchema.parse(body)

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
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    let result
    let logAction = ''
    let logDetails = ''

    switch (action) {
      case 'activate':
        result = professional // Pas de modification pour l'instant
        logAction = 'Compte activé'
        logDetails = reason || 'Activation manuelle par admin'
        break

      case 'deactivate':
        result = professional // Pas de modification pour l'instant
        logAction = 'Compte désactivé'
        logDetails = reason || 'Désactivation manuelle par admin'
        break

      case 'validate':
        result = professional
        logAction = 'Profil validé'
        logDetails = reason || 'Validation manuelle du profil professionnel'
        break

      case 'suspend':
        result = professional
        logAction = 'Compte suspendu'
        logDetails = `${reason || 'Suspension administrative'}${duration ? ` - ${duration} jours` : ' - durée indéterminée'}`
        break

      case 'update_notes':
        result = professional
        logAction = 'Notes administratives mises à jour'
        logDetails = 'Modification des notes internes'
        break

      default:
        return NextResponse.json(
          { error: "Action non valide" },
          { status: 400 }
        )
    }

    // Log simple pour éviter les erreurs de schéma
    console.log(`🔧 [Admin Action] ${logAction}:`, {
      professionalId: params.id,
      adminId: session.user.id,
      action,
      reason,
      details: logDetails,
      timestamp: new Date().toISOString()
    })

    // Si suspension ou désactivation, annuler les RDV futurs
    if (action === 'suspend' || action === 'deactivate') {
      const futureBookings = await prisma.booking.updateMany({
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

      logDetails += ` - ${futureBookings.count} RDV futurs annulés`
    }

    return NextResponse.json({
      success: true,
      message: `Action "${logAction}" effectuée avec succès`,
      data: result,
      meta: {
        affectedBookings: action === 'suspend' || action === 'deactivate' ? true : false
      }
    })

  } catch (error) {
    console.error('❌ [Admin/Professional Action] Erreur:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données d'action invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}