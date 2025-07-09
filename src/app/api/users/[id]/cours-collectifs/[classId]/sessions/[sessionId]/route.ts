// src/app/api/users/[id]/cours-collectifs/[classId]/sessions/[sessionId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { sendEmail } from "@/lib/emails/send-email";

// DELETE - Supprimer une séance avec notifications
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; classId: string; sessionId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const sendNotifications = searchParams.get('notify') !== 'false' // par défaut true

    console.log(`🗑️ Tentative de suppression de la séance ${params.sessionId}`)
    console.log(`   Notifications: ${sendNotifications}`)

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

    // Vérifier que la séance existe et appartient au bon professionnel
    const groupSession = await prisma.groupSession.findFirst({
      where: {
        id: params.sessionId,
        groupClass: {
          id: params.classId,
          professional: { userId: session.user.id }
        }
      },
      include: {
        groupClass: {
          select: { 
            name: true, 
            isOnline: true, 
            city: true, 
            address: true 
          }
        },
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
    })

    if (!groupSession) {
      console.log(`❌ Séance ${params.sessionId} non trouvée pour le professionnel ${professional.id}`)
      return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 })
    }

    console.log(`✅ Séance trouvée: ${groupSession.groupClass.name}`)
    console.log(`📊 Inscriptions actives: ${groupSession.registrations.length}`)

    // Collecter les participants à notifier
    const participantsToNotify = []
    if (sendNotifications) {
      for (const registration of groupSession.registrations) {
        participantsToNotify.push({
          name: registration.client.user.name,
          email: registration.client.user.email,
          registrationId: registration.id
        })
      }
    }

    // Supprimer la séance (les inscriptions seront supprimées automatiquement)
    await prisma.groupSession.delete({
      where: { id: params.sessionId }
    })

    console.log(`✅ Séance ${params.sessionId} supprimée avec succès`)

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
                                      "La séance a été annulée par le professionnel"
              
              // Préparer la signature email personnalisée
              const emailSignature = professional.notifications?.emailSignature || 
                                    `Cordialement,\n${professional.user.name || 'Votre professionnel'}`
              
              await sendEmail({
                to: participant.email || 'participant@example.com',
                subject: `Annulation de la séance "${groupSession.groupClass.name}"`,
                template: 'session-cancellation',
                data: {
                  participantName: participant.name || 'Participant',
                  courseName: groupSession.groupClass.name,
                  professionalName: professional.user.name || 'Professionnel',
                  sessionDate: new Date(groupSession.startTime).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  sessionLocation: groupSession.groupClass.isOnline 
                    ? "En ligne" 
                    : `${groupSession.groupClass.address || ''} ${groupSession.groupClass.city}`.trim(),
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
      message: "Séance supprimée avec succès",
      notificationsSent: notificationsSent
    })

  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la séance:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}