// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma/client"
import { Resend } from 'resend'
import { createToken } from "@/lib/utils/token"

const resend = new Resend(process.env.RESEND_API_KEY)

// Schéma de validation
const schema = z.object({
  email: z.string().email("Format d'email invalide"),
})

export async function POST(req: Request) {
  try {
    // Récupération et validation de l'email
    const body = await req.json()
    const { email } = schema.parse(body)

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Pour des raisons de sécurité, on renvoie toujours une réponse succès
    // même si l'utilisateur n'existe pas
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Créer un token de réinitialisation valide 1h
    const token = await createToken(user.id, '1h')

    // Sauvegarder le token dans la base de données
    await prisma.resetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000), // 1h
      }
    })

    // URL de réinitialisation
    const resetUrl = `${process.env.NEXTAUTH_URL}/reinitialiser-mot-de-passe?token=${token}`

    // Envoyer l'email
    await resend.emails.send({
      from: 'SereniBook <onboarding@resend.dev>', // Adresse par défaut de Resend pour les tests
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
        <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien est valable 1 heure.</p>
        <p>Si vous n'avez pas demandé à réinitialiser votre mot de passe, ignorez cet email.</p>
        <p>À bientôt,<br>L'équipe SereniBook</p>
      `
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[FORGOT PASSWORD]", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}