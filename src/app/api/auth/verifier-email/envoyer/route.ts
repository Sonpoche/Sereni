// src/app/api/auth/verifier-email/envoyer/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { Resend } from 'resend'
import crypto from 'crypto'
import { EmailTemplates } from "@/lib/emails/email-template"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Email manquant" },
        { status: 400 }
      )
    }
    
    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    // Générer un token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex')
    
    // Supprimer les anciens tokens de cet utilisateur s'il y en a
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email }
    })
    
    // Sauvegarder le nouveau token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      }
    })

    // URL de vérification
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verifier-email?token=${verificationToken}`

    // Envoyer l'email avec le template
    await resend.emails.send({
      from: 'SereniBook <onboarding@resend.dev>',
      to: user.email,
      subject: 'Vérification de votre email - SereniBook',
      html: EmailTemplates.verificationEmail({
        name: user.name || 'Utilisateur',
        url: verificationUrl
      })
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[SEND VERIFICATION EMAIL]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}