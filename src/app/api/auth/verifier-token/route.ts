// src/app/api/auth/verifier-token/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      )
    }

    // Vérifier si le token existe et est valide
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

    return NextResponse.json({ valid: true })

  } catch (error) {
    console.error("[VERIFY TOKEN]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}