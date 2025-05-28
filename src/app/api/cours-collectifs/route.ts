// src/app/api/cours-collectifs/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const onlineOnly = searchParams.get('online') === 'true'

    // Construction des filtres
    const filters: any = {
      active: true
    }

    if (category) {
      filters.category = category
    }

    if (level) {
      filters.level = level
    }

    if (onlineOnly) {
      filters.isOnline = true
    }

    // Récupérer tous les cours collectifs actifs
    const groupClasses = await prisma.groupClass.findMany({
      where: filters,
      include: {
        professional: {
          include: {
            user: {
              select: { 
                name: true 
              }
            }
          }
        },
        sessions: {
          where: {
            startTime: { gte: new Date() },
            status: "SCHEDULED"
          },
          orderBy: { startTime: 'asc' },
          take: 3,
          include: {
            registrations: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convertir les objets Decimal en nombres
    const serializedClasses = groupClasses.map(course => ({
      ...course,
      price: Number(course.price), // Conversion Decimal -> Number
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      sessions: course.sessions.map(session => ({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString()
      }))
    }))

    // Filtrer par recherche textuelle si nécessaire
    let filteredClasses = serializedClasses
    if (search) {
      const searchLower = search.toLowerCase()
      filteredClasses = serializedClasses.filter(course => 
        course.name.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        // Vérifier que name n'est pas null
        (course.professional.user.name && course.professional.user.name.toLowerCase().includes(searchLower)) ||
        course.city?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(filteredClasses)

  } catch (error) {
    console.error("Erreur lors de la récupération des cours collectifs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}