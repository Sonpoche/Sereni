// src/app/api/cours-collectifs/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const city = searchParams.get('city')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Récupérer tous les cours collectifs actifs
    const groupClasses = await prisma.groupClass.findMany({
      where: {
        active: true,
        ...(category && category !== 'all' ? { category } : {}),
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      },
      include: {
        professional: {
          include: {
            user: {
              select: {
                name: true,
                id: true
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
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Calculer les places disponibles pour chaque cours
    const coursesWithAvailability = groupClasses.map(course => ({
      ...course,
      availablePlaces: course.sessions.reduce((total, session) => {
        return total + (course.maxParticipants - session.registrations.length)
      }, 0),
      nextSession: course.sessions[0] || null
    }))

    return NextResponse.json(coursesWithAvailability)

  } catch (error) {
    console.error("Erreur lors de la récupération des cours collectifs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}