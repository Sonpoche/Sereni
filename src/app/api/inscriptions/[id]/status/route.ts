// src/app/api/inscriptions/[id]/status/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { Resend } from "resend"
import { CourseEmailTemplates } from "@/lib/emails/course-email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

const statusSchema = z.object({
  status: z.enum(["REGISTERED", "CONFIRMED", "CANCELLED", "ATTENDED", "NO_SHOW"])
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = statusSchema.parse(body)

    // Récupérer l'inscription avec toutes les informations nécessaires
    const registration = await prisma.groupRegistration.findUnique({
      where: { id: params.id },
      include: {
        session: {
          include: {
            groupClass: {
              include: {
                professional: {
                  include: {
                    user: { select: { id: true, name: true, email: true } }
                  }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur connecté est bien le professionnel propriétaire
    if (registration.session.groupClass.professional.user.id !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Stocker l'ancien statut pour la logique de mise à jour
    const oldStatus = registration.status

    // Mettre à jour le statut de l'inscription
    const updatedRegistration = await prisma.groupRegistration.update({
      where: { id: params.id },
      data: { status }
    })

    // Mettre à jour le compteur de participants de la session si nécessaire
    if (status === "CANCELLED" && oldStatus !== "CANCELLED") {
      // Diminuer le nombre de participants
      await prisma.groupSession.update({
        where: { id: registration.sessionId },
        data: {
          currentParticipants: {
            decrement: 1
          }
        }
      })
    } else if (status !== "CANCELLED" && oldStatus === "CANCELLED") {
      // Augmenter le nombre de participants
      await prisma.groupSession.update({
        where: { id: registration.sessionId },
        data: {
          currentParticipants: {
            increment: 1
          }
        }
      })
    }

    // Envoyer un email de notification au client selon le statut
    if (registration.client.user.email) {
      try {
        let emailSubject = ""
        let emailTemplate = ""

        switch (status) {
          case "CONFIRMED":
            emailSubject = `Inscription confirmée - ${registration.session.groupClass.name}`
            emailTemplate = CourseEmailTemplates.courseRegistrationConfirmation({
              clientName: registration.client.user.name || "Client",
              courseName: registration.session.groupClass.name,
              professionalName: registration.session.groupClass.professional.user.name || "Praticien",
              date: registration.session.startTime.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              time: registration.session.startTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              isOnline: registration.session.groupClass.isOnline,
              address: registration.session.groupClass.address || undefined,
              city: registration.session.groupClass.city || undefined,
              equipment: registration.session.groupClass.equipment
            })
            break

          case "CANCELLED":
            emailSubject = `Inscription annulée - ${registration.session.groupClass.name}`
            emailTemplate = CourseEmailTemplates.courseRegistrationCancelled({
              clientName: registration.client.user.name || "Client",
              courseName: registration.session.groupClass.name,
              professionalName: registration.session.groupClass.professional.user.name || "Praticien",
              date: registration.session.startTime.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              time: registration.session.startTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              reason: "Annulation par le praticien"
            })
            break

          case "ATTENDED":
            emailSubject = `Merci pour votre participation - ${registration.session.groupClass.name}`
            // Utiliser un template simple en attendant la création du template spécialisé
            emailTemplate = `
              <h2>Merci pour votre participation !</h2>
              <p>Bonjour ${registration.client.user.name || "Client"},</p>
              <p>Merci d'avoir participé au cours "${registration.session.groupClass.name}" le ${registration.session.startTime.toLocaleDateString('fr-FR')}.</p>
              <p>Votre présence a été enregistrée.</p>
            `
            break

          case "NO_SHOW":
            emailSubject = `Absence constatée - ${registration.session.groupClass.name}`
            // Utiliser un template simple en attendant la création du template spécialisé
            emailTemplate = `
              <h2>Absence constatée</h2>
              <p>Bonjour ${registration.client.user.name || "Client"},</p>
              <p>Nous constatons que vous n'avez pas pu participer au cours "${registration.session.groupClass.name}" le ${registration.session.startTime.toLocaleDateString('fr-FR')}.</p>
              <p>N'hésitez pas à vous inscrire à une prochaine séance.</p>
            `
            break
        }

        if (emailTemplate) {
          await resend.emails.send({
            from: 'SereniBook <notifications@serenibook.fr>',
            to: registration.client.user.email,
            subject: emailSubject,
            html: emailTemplate
          })
        }
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email au client:", emailError)
        // Ne pas faire échouer la requête pour une erreur d'email
      }
    }

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
      message: `Inscription ${getStatusLabel(status)} avec succès`
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    
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

// Fonction utilitaire pour les libellés de statut
function getStatusLabel(status: string): string {
  switch (status) {
    case "REGISTERED":
      return "inscrite"
    case "CONFIRMED":
      return "confirmée"
    case "CANCELLED":
      return "annulée"
    case "ATTENDED":
      return "marquée comme présente"
    case "NO_SHOW":
      return "marquée comme absente"
    default:
      return "mise à jour"
  }
}

// GET pour récupérer les détails d'une inscription (optionnel)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const registration = await prisma.groupRegistration.findUnique({
      where: { id: params.id },
      include: {
        session: {
          include: {
            groupClass: {
              include: {
                professional: {
                  include: {
                    user: { select: { id: true, name: true, email: true } }
                  }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur connecté est soit le professionnel soit le client
    const isProfessional = registration.session.groupClass.professional.user.id === session.user.id
    const isClient = registration.client.userId === session.user.id

    if (!isProfessional && !isClient) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json(registration)

  } catch (error) {
    console.error("Erreur lors de la récupération de l'inscription:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}