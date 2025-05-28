// src/app/api/users/[id]/cours-collectifs/[classId]/sessions/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

const sessionSchema = z.object({
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  notes: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string; classId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = sessionSchema.parse(body)

    // Récupérer le cours collectif
    const groupClass = await prisma.groupClass.findFirst({
      where: {
        id: params.classId,
        professional: { userId: session.user.id }
      }
    })

    if (!groupClass) {
      return NextResponse.json({ error: "Cours collectif non trouvé" }, { status: 404 })
    }

    // Calculer les heures de début et fin
    const startDateTime = new Date(`${data.date}T${data.startTime}:00`)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + groupClass.duration)

    // Créer la session
    const newSession = await prisma.groupSession.create({
      data: {
        groupClassId: groupClass.id,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: data.notes,
        status: "SCHEDULED"
      }
    })

    return NextResponse.json({
      success: true,
      session: newSession
    })

  } catch (error) {
    console.error("Erreur lors de la création de la session:", error)
    
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