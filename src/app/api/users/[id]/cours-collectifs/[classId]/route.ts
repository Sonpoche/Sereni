// src/app/api/users/[id]/cours-collectifs/[classId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { geocodeAddress } from "@/lib/utils/geocoding"
import { sendEmail } from "@/lib/emails/send-email"

const groupClassSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: z.number().min(0, "Le prix doit être positif"),
  duration: z.number().min(15, "La durée minimum est de 15 minutes"),
  maxParticipants: z.number().min(2, "Au moins 2 participants requis").max(50, "Maximum 50 participants"),
  category: z.string().min(1, "Sélectionnez une catégorie"),
  level: z.string().optional(),
  isOnline: z.boolean(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  equipment: z.array(z.string()).default([]),
})

// PATCH - Modifier un cours collectif
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; classId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = groupClassSchema.parse(body)

    // Vérifier que le cours appartient bien au professionnel
    const groupClass = await prisma.groupClass.findFirst({
      where: {
        id: params.classId,
        professional: { userId: session.user.id }
      }
    })

    if (!groupClass) {
      return NextResponse.json({ error: "Cours collectif non trouvé" }, { status: 404 })
    }

    // Géocoder l'adresse si c'est un cours présentiel
    let latitude = groupClass.latitude
    let longitude = groupClass.longitude
    
    if (!data.isOnline && data.city) {
      const coords = await geocodeAddress(`${data.address || ''} ${data.city}, ${data.postalCode || ''} France`)
      if (coords) {
        latitude = coords.latitude
        longitude = coords.longitude
      }
    }

    // Mettre à jour le cours collectif
    const updatedGroupClass = await prisma.groupClass.update({
      where: { id: params.classId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        maxParticipants: data.maxParticipants,
        category: data.category,
        level: data.level,
        isOnline: data.isOnline,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        latitude,
        longitude,
        equipment: data.equipment,
      },
      include: {
        sessions: {
          include: {
            registrations: {
              select: { id: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      groupClass: updatedGroupClass
    })

  } catch (error) {
    console.error("Erreur lors de la modification du cours collectif:", error)
    
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

// DELETE - Supprimer un cours collectif avec gestion des notifications
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; classId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'
    const sendNotifications = searchParams.get('notify') !== 'false' // par défaut true

    console.log(`🗑️ Tentative de suppression du cours ${params.classId} par l'utilisateur ${params.id}`)
    console.log(`   Force: ${forceDelete}, Notifications: ${sendNotifications}`)

    // Récupérer le profil professionnel avec ses paramètres de notification
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        notifications: true
      }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Vérifier que le cours appartient bien au professionnel
    const groupClass = await prisma.groupClass.findFirst({
      where: {
        id: params.classId,
        professionalId: professional.id
      },
      include: {
        sessions: {
          include: {
            registrations: {
              where: {
                status: { not: "CANCELLED" }
              },
              include: {
                client: {
                  include: {
                    user: {
                      select: { name: true, email: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!groupClass) {
      console.log(`❌ Cours collectif ${params.classId} non trouvé pour le professionnel ${professional.id}`)
      return NextResponse.json({ error: "Cours collectif non trouvé" }, { status: 404 })
    }

    console.log(`✅ Cours collectif trouvé: ${groupClass.name}`)

    // Compter les inscriptions actives
    const activeRegistrations = groupClass.sessions.reduce((total, session) => {
      return total + session.registrations.length
    }, 0)

    console.log(`📊 Inscriptions actives trouvées: ${activeRegistrations}`)

    // Si il y a des inscriptions actives et qu'on ne force pas la suppression
    if (activeRegistrations > 0 && !forceDelete) {
      return NextResponse.json({ 
        error: "Impossible de supprimer ce cours collectif car il y a des inscriptions actives",
        activeRegistrations,
        needsConfirmation: true,
        participants: groupClass.sessions.flatMap(session => 
          session.registrations.map(reg => ({
            name: reg.client.user.name,
            email: reg.client.user.email,
            sessionDate: session.startTime
          }))
        )
      }, { status: 409 })
    }

    // Collecter tous les participants à notifier
    const participantsToNotify = []
    if (sendNotifications) {
      for (const session of groupClass.sessions) {
        for (const registration of session.registrations) {
          participantsToNotify.push({
            name: registration.client.user.name,
            email: registration.client.user.email,
            sessionDate: session.startTime
          })
        }
      }
    }

    // Supprimer le cours collectif (les sessions et inscriptions seront supprimées automatiquement)
    await prisma.groupClass.delete({
      where: { id: params.classId }
    })

    console.log(`✅ Cours collectif ${params.classId} supprimé avec succès`)

    // Envoyer les notifications par email aux participants
    let notificationsSent = 0
    if (sendNotifications && participantsToNotify.length > 0) {
      // Vérifier si les notifications d'annulation sont activées
      const notificationsEnabled = professional.notifications?.emailEnabled && 
                                  professional.notifications?.cancelationNotifications
      
      if (notificationsEnabled) {
        console.log(`📧 Envoi des notifications à ${participantsToNotify.length} participants`)
        
        try {
          const emailPromises = participantsToNotify.map(async (participant) => {
            try {
              // Utiliser la raison d'annulation personnalisée ou celle par défaut
              const cancelationReason = professional.notifications?.defaultCancelationReason || 
                                      "Le cours collectif a été supprimé par le professionnel"
              
              // Préparer la signature email personnalisée
              const emailSignature = professional.notifications?.emailSignature || 
                                    `Cordialement,\n${professional.user.name || 'Votre professionnel'}`
              
              await sendEmail({
                to: participant.email || 'participant@example.com',
                subject: `Annulation du cours collectif "${groupClass.name}"`,
                template: 'course-cancellation',
                data: {
                  participantName: participant.name || 'Participant',
                  courseName: groupClass.name,
                  professionalName: professional.user.name || 'Professionnel',
                  sessionDate: new Date(participant.sessionDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  reason: cancelationReason,
                  contactEmail: professional.user.email || 'contact@votre-domaine.com',
                  emailSignature: emailSignature
                }
              })
              notificationsSent++
              console.log(`✅ Email envoyé à ${participant.name} (${participant.email})`)
            } catch (emailError) {
              console.error(`❌ Erreur envoi email à ${participant.email}:`, emailError)
              // On continue même si un email échoue
            }
          })
          
          await Promise.allSettled(emailPromises)
          console.log(`✅ ${notificationsSent}/${participantsToNotify.length} notifications envoyées`)
        } catch (emailError) {
          console.error("❌ Erreur lors de l'envoi des notifications:", emailError)
          // On continue malgré l'erreur d'email
        }
      } else {
        console.log(`📧 Notifications désactivées dans les paramètres pour l'utilisateur ${params.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cours collectif supprimé avec succès",
      notificationsSent: notificationsSent
    })

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du cours collectif:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}