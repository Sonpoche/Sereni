// src/app/api/register/route.ts
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import prisma from "@/lib/prisma/client"
import { UserRole } from "@prisma/client"
import { Resend } from 'resend'
import crypto from 'crypto'
import { EmailTemplates } from "@/lib/emails/email-template"

const resend = new Resend(process.env.RESEND_API_KEY)

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit comporter au moins 8 caractères")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&+])[A-Za-z\d@$!%*#?&+]{8,}$/,
      "Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial (@$!%*#?&+)"
    ),
  name: z.string(),
  role: z.nativeEnum(UserRole)
})

export async function POST(req: Request) {
  try {
    // Récupérer et valider les données
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(data.password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role
      }
    })

    // Générer un token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex')
    
    // Sauvegarder le token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      }
    })

    // URL de vérification
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verifier-email?token=${verificationToken}`

    // Envoyer l'email de vérification en utilisant le template
    await resend.emails.send({
      from: 'SereniBook <onboarding@resend.dev>',
      to: user.email!,
      subject: 'Vérification de votre email - SereniBook',
      html: EmailTemplates.verificationEmail({
        name: user.name || 'Utilisateur',
        url: verificationUrl
      })
    })

    // Retourner l'utilisateur sans le mot de passe
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    )
  }
}