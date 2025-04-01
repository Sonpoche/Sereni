// src/app/api/register/check-email/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma/client"

const schema = z.object({
  email: z.string().email("Format d'email invalide"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    return NextResponse.json({ exists: !!existingUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    console.error("Erreur lors de la vérification de l'email:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}