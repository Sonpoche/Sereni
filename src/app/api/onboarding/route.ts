import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { UserRole, Prisma } from "@prisma/client"
import prisma from "@/lib/prisma/client"
import { mapProfessionalTypeToDB } from "@/lib/utils/type-mapping"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log('🟦 [API] Données reçues:', data)

    if (!data?.userId) {
      console.error('🔴 [API] ID utilisateur manquant')
      return Response.json({ 
        success: false,
        error: "ID utilisateur manquant" 
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const userBefore = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        professionalProfile: true,
        clientProfile: true,
      }
    })

    if (!userBefore) {
      console.error('🔴 [API] Utilisateur non trouvé')
      return Response.json({ 
        success: false,
        error: "Utilisateur non trouvé" 
      }, { status: 404 })
    }

    // Créer le profil selon le rôle
    if (data.role === UserRole.PROFESSIONAL) {
      try {
        if (userBefore.professionalProfile) {
          console.log('🟨 [API] Profil professionnel déjà existant')
          return Response.json({ 
            success: true,
            message: "Le profil existe déjà",
            redirect: "/tableau-de-bord"
          })
        }

        // Convertir le type d'activité
        const dbType = mapProfessionalTypeToDB(data.activity.type)
        console.log('🟦 [API] Création du profil professionnel...')

        // Création du profil dans une transaction
        const result = await prisma.$transaction(async (tx) => {
          // Créer d'abord le profil professionnel
          const professional = await tx.professional.create({
            data: {
              userId: userBefore.id,
              type: dbType,
              otherTypeDetails: data.activity.otherTypeDetails,
              yearsExperience: data.activity.experience,
              phone: data.personalInfo.phone,
              address: data.personalInfo.address,
              city: data.personalInfo.city,
              postalCode: data.personalInfo.postalCode,
              bio: data.bio.bio,
              description: data.bio.approach,
              autoConfirmBookings: false,
              languages: ["fr"],
              notifications: {
                create: {
                  emailEnabled: data.preferences.notifications.email.bookingConfirmation,
                  smsEnabled: data.preferences.notifications.sms.bookingConfirmation,
                  marketingEmails: data.preferences.notifications.email.newsletter || false,
                }
              }
            },
          })

          console.log('🟦 [API] Profil professionnel créé, ID:', professional.id)

          // Mise à jour directe avec Prisma.sql
          await tx.$executeRaw`UPDATE "User" SET "hasProfile" = true WHERE id = ${userBefore.id}`

          // Mettre à jour le nom si fourni
          if (data.personalInfo.name) {
            await tx.user.update({
              where: { id: userBefore.id },
              data: { name: data.personalInfo.name }
            })
          }

          return professional
        })

        return Response.json({ 
          success: true,
          data: result,
          redirect: "/tableau-de-bord?fromOnboarding=true"
        })

      } catch (error) {
        console.error('🔴 [API] Erreur lors de la création du profil professionnel:', error)
        return Response.json({ 
          success: false,
          error: "Erreur lors de la création du profil" 
        }, { status: 500 })
      }
    }

    if (data.role === UserRole.CLIENT) {
      try {
        if (userBefore.clientProfile) {
          console.log('🟨 [API] Profil client déjà existant')
          return Response.json({ 
            success: true,
            message: "Le profil existe déjà",
            redirect: "/tableau-de-bord"
          })
        }

        console.log('🟦 [API] Création du profil client...')

        // Création du profil dans une transaction
        const result = await prisma.$transaction(async (tx) => {
          // Créer d'abord le profil client
          const client = await tx.client.create({
            data: {
              userId: userBefore.id,
              phone: data.personalInfo.phone,
              address: data.personalInfo.address,
              city: data.personalInfo.city,
              postalCode: data.personalInfo.postalCode,
              notes: "",
              preferredLanguage: "fr"
            },
          })

          console.log('🟦 [API] Profil client créé, ID:', client.id)

          // Mise à jour directe avec Prisma.sql
          await tx.$executeRaw`UPDATE "User" SET "hasProfile" = true WHERE id = ${userBefore.id}`

          // Mettre à jour le nom si fourni
          if (data.personalInfo.name) {
            await tx.user.update({
              where: { id: userBefore.id },
              data: { name: data.personalInfo.name }
            })
          }

          return client
        })

        return Response.json({ 
          success: true,
          data: result,
          redirect: "/tableau-de-bord?fromOnboarding=true"
        })

      } catch (error) {
        console.error('🔴 [API] Erreur lors de la création du profil client:', error)
        return Response.json({ 
          success: false,
          error: "Erreur lors de la création du profil" 
        }, { status: 500 })
      }
    }

    return Response.json({ 
      success: false,
      error: "Type de profil non supporté" 
    }, { status: 400 })

  } catch (error) {
    console.error('🔴 [API] Erreur détaillée:', error)
    return Response.json({
      success: false,
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}