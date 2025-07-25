// src/app/api/admin/users/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import { UserRole } from "@prisma/client"
import prisma from "@/lib/prisma/client"

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

    // Récupérer tous les utilisateurs avec leurs données
    const users = await prisma.user.findMany({
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true
          }
        },
        professionalProfile: {
          select: {
            type: true,
            city: true,
            _count: {
              select: {
                services: true,
                bookings: true
              }
            }
          }
        },
        clientProfile: {
          select: {
            city: true,
            _count: {
              select: {
                bookings: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Créer le contenu CSV
    const csvHeaders = [
      'ID',
      'Nom',
      'Email',
      'Rôle',
      'Profil Complet',
      'Email Vérifié',
      'Plan Abonnement',
      'Statut Abonnement',
      'Ville',
      'Type Professionnel',
      'Nombre Services',
      'Nombre RDV',
      'Date Inscription',
      'Dernière Mise à Jour'
    ]

    const csvData = users.map(user => {
      const subscription = user.subscription
      const professionalProfile = user.professionalProfile
      const clientProfile = user.clientProfile

      return [
        user.id,
        user.name || '',
        user.email || '',
        user.role,
        user.hasProfile ? 'Oui' : 'Non',
        user.emailVerified ? 'Oui' : 'Non',
        subscription?.plan || '',
        subscription?.status || '',
        professionalProfile?.city || clientProfile?.city || '',
        professionalProfile?.type || '',
        professionalProfile?._count.services || 0,
        (professionalProfile?._count.bookings || 0) + (clientProfile?._count.bookings || 0),
        user.createdAt.toISOString().split('T')[0],
        user.updatedAt.toISOString().split('T')[0]
      ]
    })

    // Convertir en CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n')

    // Créer la réponse avec les en-têtes appropriés
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="utilisateurs_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    console.log(`✅ [Admin] Export CSV généré: ${users.length} utilisateurs par ${session.user.email}`)

    return response

  } catch (error) {
    console.error("❌ [Admin] Erreur export CSV:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    )
  }
}