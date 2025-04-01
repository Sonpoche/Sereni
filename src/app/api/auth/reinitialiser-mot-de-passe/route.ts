// src/app/api/auth/reinitialiser-mot-de-passe/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma/client"

const schema = z.object({
  token: z.string().min(1, "Token manquant"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&+])[A-Za-z\d@$!%*#?&+]{8,}$/,
      "Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial"
    ),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = schema.parse(body)

    // Vérifier le token
    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      )
    }

    // Vérifier si le token n'est pas expiré
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 400 }
      )
    }

    // Vérifier si le token n'a pas déjà été utilisé
    if (resetToken.used) {
      return NextResponse.json(
        { error: "Token déjà utilisé" },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hash(password, 10)

    // Mettre à jour le mot de passe de l'utilisateur dans une transaction
    await prisma.$transaction([
      // Mettre à jour le mot de passe
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      // Marquer le token comme utilisé
      prisma.resetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[RESET PASSWORD]", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}