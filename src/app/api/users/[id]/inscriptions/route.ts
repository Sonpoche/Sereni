// src/app/api/users/[id]/inscriptions/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { Resend } from "resend"
import { EmailTemplates } from "@/lib/emails/email-template"

const resend = new Resend(process.env.RESEND_API_KEY)

const registrationSchema = z.object({
  sessionId: z.string().min(1, "Session requise"),
  groupClassId: z.string().min(1, "Cours collectif requis"),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = registrationSchema.parse(body)

    // Récupérer le profil client
    const client = await prisma.client.findUnique({
      where: { userId: params.id },
      include: { user: true }
    })

    if (!client) {
      return NextResponse.json({ error: "Profil client non trouvé" }, { status: 404 })
    }

    // Récupérer la session de cours
    const courseSession = await prisma.groupSession.findUnique({
      where: { id: data.sessionId },
      include: {
        groupClass: {
          include: {
            professional: {
              include: {
                user: { select: { name: true, email: true } }
              }
            }
          }
        },
        registrations: true
      }
    })

    if (!courseSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await prisma.groupRegistration.findUnique({
      where: {
        sessionId_clientId: {
          sessionId: data.sessionId,
          clientId: client.id
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json({ error: "Vous êtes déjà inscrit à cette séance" }, { status: 409 })
    }

    // Vérifier les places disponibles
    const availablePlaces = courseSession.groupClass.maxParticipants - courseSession.registrations.length
    if (availablePlaces <= 0) {
      return NextResponse.json({ error: "Cette séance est complète" }, { status: 409 })
    }

    // Vérifier que la séance n'est pas dans le passé
    if (new Date(courseSession.startTime) < new Date()) {
      return NextResponse.json({ error: "Cette séance est déjà passée" }, { status: 400 })
    }

    // AJOUT : Déterminer si l'inscription doit être auto-confirmée
    const professional = courseSession.groupClass.professional
    const autoConfirm = professional.autoConfirmBookings ?? true // Par défaut, auto-confirmer
    const registrationStatus = autoConfirm ? "CONFIRMED" : "REGISTERED"

    // MODIFICATION : Créer l'inscription avec le bon statut
    const registration = await prisma.groupRegistration.create({
      data: {
        sessionId: data.sessionId,
        clientId: client.id,
        status: registrationStatus, // CONFIRMED ou REGISTERED selon les préférences
        paymentStatus: "PENDING",
      }
    })

    // Mettre à jour le compteur de participants
    await prisma.groupSession.update({
      where: { id: data.sessionId },
      data: {
        currentParticipants: {
          increment: 1
        }
      }
    })

    // MODIFICATION : Email au praticien avec statut approprié
    if (courseSession.groupClass.professional.user.email) {
      try {
        const subjectSuffix = autoConfirm ? " (confirmée automatiquement)" : " (en attente)"
        
        await resend.emails.send({
          from: 'SereniBook <notifications@serenibook.fr>',
          to: courseSession.groupClass.professional.user.email,
          subject: `Nouvelle inscription - ${courseSession.groupClass.name}${subjectSuffix}`,
          html: EmailTemplates.newRegistrationNotification({
            professionalName: courseSession.groupClass.professional.user.name || "Praticien",
            clientName: client.user.name || "Un client",
            courseName: courseSession.groupClass.name,
            sessionDate: courseSession.startTime.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            sessionTime: courseSession.startTime.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            clientEmail: client.user.email || '',
            clientPhone: client.phone || 'Non renseigné'
            // SUPPRIMÉ temporairement : autoConfirmed: autoConfirm
          })
        })
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email au praticien:", emailError)
      }
    }

    // MODIFICATION : Email au client avec message approprié
    if (client.user.email) {
      try {
        const clientSubject = autoConfirm 
          ? `Inscription confirmée - ${courseSession.groupClass.name}`
          : `Demande d'inscription envoyée - ${courseSession.groupClass.name}`

        await resend.emails.send({
          from: 'SereniBook <notifications@serenibook.fr>',
          to: client.user.email,
          subject: clientSubject,
          html: EmailTemplates.registrationConfirmationClient({
            clientName: client.user.name || "Client",
            courseName: courseSession.groupClass.name,
            professionalName: courseSession.groupClass.professional.user.name || "Praticien",
            sessionDate: courseSession.startTime.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            sessionTime: courseSession.startTime.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            price: Number(courseSession.groupClass.price)
            // SUPPRIMÉ temporairement : isConfirmed: autoConfirm
          })
        })
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email au client:", emailError)
      }
    }

    // MODIFICATION : Retourner l'information sur l'auto-confirmation
    return NextResponse.json({
      success: true,
      registration,
      autoConfirmed: autoConfirm,
      message: autoConfirm 
        ? "Inscription confirmée automatiquement !" 
        : "Inscription enregistrée, en attente de validation"
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
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// GET pour récupérer les inscriptions de l'utilisateur (inchangé)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { userId: params.id }
    })

    if (!client) {
      return NextResponse.json([])
    }

    const registrations = await prisma.groupRegistration.findMany({
      where: { clientId: client.id },
      include: {
        session: {
          include: {
            groupClass: {
              include: {
                professional: {
                  include: {
                    user: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    })

    return NextResponse.json(registrations)

  } catch (error) {
    console.error("Erreur lors de la récupération des inscriptions:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}