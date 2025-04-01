// src/app/api/auth/verifier-email/confirmer/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"

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

    console.log('🟦 [Verify Email] Vérification du token:', token)

    // Vérifier si le token existe et est valide
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    console.log('🟦 [Verify Email] Token trouvé dans la base:', verificationToken)

    if (!verificationToken) {
      // Vérifier si l'utilisateur existe déjà dans un état vérifié
      // Ce cas peut arriver si le token a déjà été utilisé
      return NextResponse.json(
        { error: "Token invalide ou déjà utilisé" },
        { status: 400 }
      )
    }

    // Vérifier si le token n'est pas expiré
    if (verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 400 }
      )
    }

    // Mettre à jour le statut de vérification de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() }
    })

    console.log('🟦 [Verify Email] Utilisateur mis à jour:', updatedUser.id)

    // Supprimer le token utilisé
    await prisma.verificationToken.delete({
      where: { token }
    })
    
    console.log('🟦 [Verify Email] Token supprimé')
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("🔴 [VERIFY EMAIL]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}