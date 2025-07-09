// src/app/api/users/[id]/parametres/notifications/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  reminderHours: z.number().min(1).max(168), // Entre 1 heure et 7 jours
  cancelationNotifications: z.boolean(),
  newBookingNotifications: z.boolean(),
  reminderNotifications: z.boolean(),
  emailSignature: z.string().max(500).optional(),
  defaultCancelationReason: z.string().max(200).optional(),
  autoConfirmCancelations: z.boolean(),
})

// GET - Récupérer les paramètres de notification
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log(`📋 Récupération des paramètres de notification pour l'utilisateur ${id}`)

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      include: {
        notifications: true
      }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    console.log("Professional trouvé:", professional.id)
    console.log("Notifications:", professional.notifications)

    // Si aucun paramètre n'existe, retourner les valeurs par défaut
    if (!professional.notifications) {
      console.log("📋 Aucun paramètre trouvé, retour des valeurs par défaut")
      return NextResponse.json({
        success: true,
        settings: {
          emailEnabled: true,
          smsEnabled: false,
          reminderHours: 24,
          cancelationNotifications: true,
          newBookingNotifications: true,
          reminderNotifications: true,
          emailSignature: "",
          defaultCancelationReason: "Raisons personnelles",
          autoConfirmCancelations: false
        }
      })
    }

    console.log("✅ Paramètres de notification récupérés")

    return NextResponse.json({
      success: true,
      settings: {
        id: professional.notifications.id,
        emailEnabled: professional.notifications.emailEnabled,
        smsEnabled: professional.notifications.smsEnabled,
        reminderHours: professional.notifications.reminderHours,
        cancelationNotifications: professional.notifications.cancelationNotifications ?? true,
        newBookingNotifications: professional.notifications.newBookingNotifications ?? true,
        reminderNotifications: professional.notifications.reminderNotifications ?? true,
        emailSignature: professional.notifications.emailSignature || "",
        defaultCancelationReason: professional.notifications.defaultCancelationReason || "Raisons personnelles",
        autoConfirmCancelations: professional.notifications.autoConfirmCancelations ?? false
      }
    })

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des paramètres:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer ou mettre à jour les paramètres de notification
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const data = notificationSettingsSchema.parse(body)

    console.log(`💾 Sauvegarde des paramètres de notification pour l'utilisateur ${id}`)

    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      include: {
        notifications: true
      }
    })

    if (!professional) {
      return NextResponse.json({ error: "Profil professionnel non trouvé" }, { status: 404 })
    }

    // Créer ou mettre à jour les paramètres
    const notificationSettings = await prisma.notificationSettings.upsert({
      where: {
        professionalId: professional.id
      },
      create: {
        professionalId: professional.id,
        emailEnabled: data.emailEnabled,
        smsEnabled: data.smsEnabled,
        reminderHours: data.reminderHours,
        cancelationNotifications: data.cancelationNotifications,
        newBookingNotifications: data.newBookingNotifications,
        reminderNotifications: data.reminderNotifications,
        emailSignature: data.emailSignature || "",
        defaultCancelationReason: data.defaultCancelationReason || "Raisons personnelles",
        autoConfirmCancelations: data.autoConfirmCancelations
      },
      update: {
        emailEnabled: data.emailEnabled,
        smsEnabled: data.smsEnabled,
        reminderHours: data.reminderHours,
        cancelationNotifications: data.cancelationNotifications,
        newBookingNotifications: data.newBookingNotifications,
        reminderNotifications: data.reminderNotifications,
        emailSignature: data.emailSignature || "",
        defaultCancelationReason: data.defaultCancelationReason || "Raisons personnelles",
        autoConfirmCancelations: data.autoConfirmCancelations
      }
    })

    console.log("✅ Paramètres de notification sauvegardés")

    return NextResponse.json({
      success: true,
      message: "Paramètres sauvegardés avec succès",
      settings: {
        id: notificationSettings.id,
        emailEnabled: notificationSettings.emailEnabled,
        smsEnabled: notificationSettings.smsEnabled,
        reminderHours: notificationSettings.reminderHours,
        cancelationNotifications: notificationSettings.cancelationNotifications,
        newBookingNotifications: notificationSettings.newBookingNotifications,
        reminderNotifications: notificationSettings.reminderNotifications,
        emailSignature: notificationSettings.emailSignature,
        defaultCancelationReason: notificationSettings.defaultCancelationReason,
        autoConfirmCancelations: notificationSettings.autoConfirmCancelations
      }
    })

  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde des paramètres:", error)
    
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