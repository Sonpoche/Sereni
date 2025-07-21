// src/app/api/onboarding/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { UserRole, ProfessionalType } from "@prisma/client"

// Schéma pour un service individuel
const serviceSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.coerce.number().min(15, "Durée minimum : 15 minutes").max(480, "Durée maximum : 8 heures"),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().default("#6746c3"),
  location: z.string().optional(),
})

// Schéma pour les horaires
const scheduleSchema = z.object({
  workingDays: z.array(z.number().min(0).max(6)),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide"),
  isFullWeek: z.boolean().optional(),
})

// ✅ Schéma de validation compatible avec le modèle Prisma
const onboardingSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRole),
  personalInfo: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional().default({}),
  activity: z.object({
    type: z.string(),
    otherTypeDetails: z.string().optional(),
    experience: z.number(),
  }).optional(),
  bio: z.object({
    bio: z.string(),
    approach: z.string(),
  }).optional(),
  schedule: scheduleSchema.optional(),
  services: z.object({
    services: z.array(serviceSchema),
  }).optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.object({
        bookingConfirmation: z.boolean(),
        bookingReminder: z.boolean(),
        bookingCancellation: z.boolean(),
        newsletter: z.boolean(),
        promotions: z.boolean(),
      }),
      sms: z.object({
        bookingConfirmation: z.boolean(),
        bookingReminder: z.boolean(),
        bookingCancellation: z.boolean(),
      }),
    }),
    privacy: z.object({
      showProfile: z.boolean(),
      showAvailability: z.boolean(),
    }).optional(),
  }),
})

// Fonction de mappage des types professionnels
const mapToProfessionalType = (type: string): ProfessionalType => {
  const mapping: Record<string, ProfessionalType> = {
    // Types exacts de Prisma
    "LIFE_COACH": "LIFE_COACH",
    "PERSONAL_COACH": "PERSONAL_COACH", 
    "YOGA_TEACHER": "YOGA_TEACHER",
    "PILATES_INSTRUCTOR": "PILATES_INSTRUCTOR",
    "THERAPIST": "THERAPIST",
    "MASSAGE_THERAPIST": "MASSAGE_THERAPIST",
    "MEDITATION_TEACHER": "MEDITATION_TEACHER",
    "OTHER": "OTHER",
    
    // Mappings depuis les valeurs Frontend
    "COACH_VIE": "LIFE_COACH",
    "COACH_SPORTIF": "PERSONAL_COACH",
    "PROF_YOGA": "YOGA_TEACHER",
    "PROF_PILATES": "PILATES_INSTRUCTOR",
    "THERAPEUTE": "THERAPIST",
    "PRATICIEN_MASSAGE": "MASSAGE_THERAPIST",
    "PROF_MEDITATION": "MEDITATION_TEACHER",
    "NATUROPATHE": "OTHER",
    "NUTRITIONNISTE": "OTHER",
    "OSTEOPATHE": "OTHER",
    "REFLEXOLOGUE": "OTHER",
    "SOPHROLOGUE": "OTHER",
    "AUTRE": "OTHER"
  }

  console.log('🔄 [API] Mappage du type:', type, '->', mapping[type] || "OTHER")
  return mapping[type] || "OTHER"
}

export async function POST(request: Request) {
  try {
    // Vérification de l'authentification
    const session = await auth()
    if (!session?.user?.id) {
      console.log('🔴 [API] Utilisateur non authentifié')
      return NextResponse.json({ 
        success: false,
        error: "Non authentifié" 
      }, { status: 401 })
    }

    // Récupération et validation des données
    const body = await request.json()
    console.log('🟦 [API] Données reçues:', JSON.stringify(body, null, 2))

    // ✅ Validation avec gestion d'erreurs détaillée
    let data;
    try {
      data = onboardingSchema.parse(body)
    } catch (validationError) {
      console.log('🔴 [API] Erreur de validation détaillée:', validationError)
      if (validationError instanceof z.ZodError) {
        console.log('🔴 [API] Détail des erreurs de validation:')
        validationError.errors.forEach((error, index) => {
          console.log(`🔴 [API] Erreur ${index + 1}:`, {
            path: error.path.join('.'),
            message: error.message,
            code: error.code
          })
        })
        
        return NextResponse.json({ 
          success: false,
          error: "Données de validation invalides",
          details: validationError.errors,
          receivedData: body
        }, { status: 400 })
      }
      throw validationError
    }

    // Vérification que l'utilisateur existe
    const userBefore = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        professionalProfile: true,
        clientProfile: true
      }
    })

    if (!userBefore) {
      console.log('🔴 [API] Utilisateur non trouvé:', data.userId)
      return NextResponse.json({ 
        success: false,
        error: "Utilisateur non trouvé" 
      }, { status: 404 })
    }

    console.log('🟦 [API] Utilisateur trouvé:', userBefore.email, 'Role:', data.role)

    // Traitement pour les professionnels
    if (data.role === UserRole.PROFESSIONAL) {
      try {
        // Vérifier si le profil professionnel existe déjà
        if (userBefore.professionalProfile) {
          console.log('🟨 [API] Profil professionnel déjà existant')
          return NextResponse.json({ 
            success: true,
            message: "Le profil existe déjà",
            redirect: "/tableau-de-bord"
          })
        }

        console.log('🟦 [API] Création du profil professionnel...')

        // ✅ Gestion robuste des données optionnelles
        const personalInfo = data.personalInfo || {}
        const activity = data.activity
        const bio = data.bio
        const services = data.services?.services || []
        const schedule = data.schedule

        // Créer le profil professionnel avec transaction
        const result = await prisma.$transaction(async (tx) => {
          // ✅ Création du professionnel compatible avec le schéma Prisma
          const professional = await tx.professional.create({
            data: {
              userId: userBefore.id,
              type: activity ? mapToProfessionalType(activity.type) : "OTHER",
              otherTypeDetails: activity?.otherTypeDetails || null,
              yearsExperience: activity?.experience || 0,
              bio: bio?.bio || "",
              description: bio?.approach || "",
              phone: personalInfo.phone || null,
              address: personalInfo.address || null,
              city: personalInfo.city || null,
              postalCode: personalInfo.postalCode || null,
              autoConfirmBookings: false,
              // Champs avec valeurs par défaut du schéma
              specialties: [],
              certifications: [],
              languages: ["fr"],
              country: "FR",
              subscriptionTier: "standard",
              allowedBookingWindow: 30,
              cancelationWindow: 24,
              bufferTime: 0,
            }
          })

          console.log('🟦 [API] Profil professionnel créé:', professional.id)

          // ✅ Créer les paramètres de notification
          await tx.notificationSettings.create({
            data: {
              professionalId: professional.id,
              emailEnabled: data.preferences.notifications.email.bookingConfirmation,
              smsEnabled: data.preferences.notifications.sms.bookingConfirmation,
              cancelationNotifications: data.preferences.notifications.email.bookingCancellation,
              newBookingNotifications: data.preferences.notifications.email.bookingConfirmation,
              reminderNotifications: data.preferences.notifications.email.bookingReminder,
              reminderHours: 24,
            }
          })

          console.log('🟦 [API] Paramètres de notification créés')

          // Créer les créneaux de disponibilité si les horaires sont fournis
          if (schedule && schedule.workingDays.length > 0) {
            console.log('🟦 [API] Création des créneaux de disponibilité...')
            
            const availabilityPromises = schedule.workingDays.map(async (dayOfWeek) => {
              return tx.availability.create({
                data: {
                  professionalId: professional.id,
                  dayOfWeek,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                }
              })
            })

            const createdAvailabilities = await Promise.all(availabilityPromises)
            console.log('🟦 [API] Créneaux créés:', createdAvailabilities.length)
          }

          // Créer les services si fournis
          if (services.length > 0) {
            console.log('🟦 [API] Création de', services.length, 'service(s)...')
            
            const servicePromises = services.map(async (serviceData, index) => {
              console.log(`🟦 [API] Création du service ${index + 1}:`, serviceData.name)
              
              return tx.service.create({
                data: {
                  name: serviceData.name,
                  description: serviceData.description,
                  duration: serviceData.duration,
                  price: serviceData.price,
                  color: serviceData.color || "#6746c3",
                  location: serviceData.location || null,
                  active: true,
                  professionalId: professional.id,
                }
              })
            })

            const createdServices = await Promise.all(servicePromises)
            console.log('🟦 [API] Services créés:', createdServices.length)
            
            return {
              professional,
              services: createdServices
            }
          }

          return { professional, services: [] }
        })

        // Mise à jour du statut hasProfile
        await prisma.$executeRaw`UPDATE "User" SET "hasProfile" = true WHERE id = ${userBefore.id}`

        // Mettre à jour le nom si fourni
        if (personalInfo.name) {
          await prisma.user.update({
            where: { id: userBefore.id },
            data: { name: personalInfo.name }
          })
        }

        console.log('🟦 [API] Onboarding professionnel terminé avec succès')
        console.log('🟦 [API] - Profil créé:', result.professional.id)
        console.log('🟦 [API] - Services créés:', result.services.length)

        return NextResponse.json({ 
          success: true,
          data: {
            professional: result.professional,
            services: result.services
          },
          redirect: "/tableau-de-bord?fromOnboarding=true"
        })

      } catch (error) {
        console.error('🔴 [API] Erreur lors de la création du profil professionnel:', error)
        return NextResponse.json({ 
          success: false,
          error: "Erreur lors de la création du profil" 
        }, { status: 500 })
      }
    }

    // Traitement pour les clients
    if (data.role === UserRole.CLIENT) {
      try {
        if (userBefore.clientProfile) {
          console.log('🟨 [API] Profil client déjà existant')
          return NextResponse.json({ 
            success: true,
            message: "Le profil existe déjà",
            redirect: "/tableau-de-bord"
          })
        }

        console.log('🟦 [API] Création du profil client...')

        const personalInfo = data.personalInfo || {}

        const clientProfile = await prisma.client.create({
          data: {
            userId: userBefore.id,
            phone: personalInfo.phone || null,
            address: personalInfo.address || null,
            city: personalInfo.city || null,
            postalCode: personalInfo.postalCode || null,
            country: "FR",
            preferredLanguage: "fr",
          },
        })

        // Mise à jour du statut hasProfile
        await prisma.$executeRaw`UPDATE "User" SET "hasProfile" = true WHERE id = ${userBefore.id}`

        // Mettre à jour le nom si fourni
        if (personalInfo.name) {
          await prisma.user.update({
            where: { id: userBefore.id },
            data: { name: personalInfo.name }
          })
        }

        console.log('🟦 [API] Profil client créé:', clientProfile.id)

        return NextResponse.json({ 
          success: true,
          data: { clientProfile },
          redirect: "/tableau-de-bord"
        })

      } catch (error) {
        console.error('🔴 [API] Erreur lors de la création du profil client:', error)
        return NextResponse.json({ 
          success: false,
          error: "Erreur lors de la création du profil" 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: false,
      error: "Type de rôle non supporté" 
    }, { status: 400 })

  } catch (error) {
    console.error('🔴 [API] Erreur générale:', error)
    
    if (error instanceof z.ZodError) {
      console.log('🔴 [API] Erreur de validation finale:', error.errors)
      return NextResponse.json({ 
        success: false,
        error: "Données invalides - validation finale",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: false,
      error: "Erreur interne du serveur" 
    }, { status: 500 })
  }
}