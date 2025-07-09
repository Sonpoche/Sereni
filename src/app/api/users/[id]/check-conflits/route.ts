// src/app/api/users/[id]/check-conflicts/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

const conflictCheckSchema = z.object({
  startTime: z.string(), // Format ISO string
  endTime: z.string(),   // Format ISO string
  excludeId: z.string().optional(), // ID à exclure de la vérification (pour modification)
  type: z.enum(['appointment', 'group-session']).optional() // Type de vérification
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = conflictCheckSchema.parse(body)

    console.log(`🔍 Vérification des conflits pour l'utilisateur ${id}`)
    console.log(`   Période: ${data.startTime} → ${data.endTime}`)
    console.log(`   Exclude ID: ${data.excludeId || 'Aucun'}`)

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    // Vérifier les conflits avec les rendez-vous individuels
    const conflictingAppointments = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        NOT: data.excludeId ? { id: data.excludeId } : undefined,
        status: { not: "CANCELLED" },
        OR: [
          // Nouveau RDV commence pendant un RDV existant
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          // Nouveau RDV finit pendant un RDV existant
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          // Nouveau RDV englobe un RDV existant
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ]
      },
      include: {
        client: {
          include: {
            user: { select: { name: true } }
          }
        },
        service: { select: { name: true } }
      }
    })

    // Vérifier les conflits avec les cours collectifs
    const conflictingGroupSessions = await prisma.groupSession.findMany({
      where: {
        groupClass: {
          professionalId: professional.id
        },
        NOT: data.excludeId?.startsWith('group-') ? { 
          id: data.excludeId.replace('group-', '') 
        } : undefined,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ]
      },
      include: {
        groupClass: { select: { name: true } }
      }
    })

    const conflicts = []

    // Formater les conflits de rendez-vous
    conflictingAppointments.forEach(apt => {
      conflicts.push({
        id: apt.id,
        type: 'appointment',
        title: apt.service.name,
        clientName: apt.client.user.name,
        startTime: apt.startTime,
        endTime: apt.endTime,
        description: `Rendez-vous ${apt.service.name} avec ${apt.client.user.name}`
      })
    })

    // Formater les conflits de cours collectifs
    conflictingGroupSessions.forEach(session => {
      conflicts.push({
        id: `group-${session.id}`,
        type: 'group-session',
        title: session.groupClass.name,
        clientName: 'Cours collectif',
        startTime: session.startTime,
        endTime: session.endTime,
        description: `Cours collectif ${session.groupClass.name}`
      })
    })

    console.log(`📊 ${conflicts.length} conflit(s) détecté(s)`)

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts,
      message: conflicts.length > 0 
        ? `${conflicts.length} conflit(s) détecté(s) sur ce créneau`
        : "Aucun conflit détecté"
    })

  } catch (error) {
    console.error("❌ Erreur lors de la vérification des conflits:", error)
    
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