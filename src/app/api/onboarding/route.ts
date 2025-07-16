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

// Schéma de validation pour les données d'onboarding
const onboardingSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRole),
  personalInfo: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  activity: z.object({
    type: z.string(),
    otherTypeDetails: z.string().optional(),
    experience: z.number(),
  }).optional(),
  bio: z.object({
    bio: z.string(),
    approach: z.string(),
  }).optional(),
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
    "coach": "LIFE_COACH",
    "therapeute": "THERAPIST", 
    "masseur": "MASSAGE_THERAPIST",
    "COACH_VIE": "LIFE_COACH",
    "COACH_SPORTIF": "PERSONAL_COACH",
    "PROF_YOGA": "YOGA_TEACHER",
    "PROF_PILATES": "PILATES_INSTRUCTOR",
    "THERAPEUTE": "THERAPIST",
    "PRATICIEN_MASSAGE": "MASSAGE_THERAPIST",
    "PROF_MEDITATION": "MEDITATION_TEACHER",
  }
  
  return mapping[type] || "OTHER"
}

export async function POST(request: Request) {
  try {
    console.log('🟦 [API] Début de l\'onboarding')
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id) {
      console.log('🔴 [API] Utilisateur non authentifié')
      return NextResponse.json({ 
        success: false,
        error: "Non authentifié" 
      }, { status: 401 })
    }

    // Récupérer et valider les données
    const body = await request.json()
    console.log('🟦 [API] Données reçues:', JSON.stringify(body, null, 2))
    
    const data = onboardingSchema.parse(body)
    console.log('🟦 [API] Données validées pour l\'utilisateur:', data.userId)

    // Vérifier que l'utilisateur existe
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
        if (userBefore.professionalProfile) {
          console.log('🟨 [API] Profil professionnel déjà existant')
          return NextResponse.json({ 
            success: true,
            message: "Le profil existe déjà",
            redirect: "/tableau-de-bord"
          })
        }

        console.log('🟦 [API] Création du profil professionnel avec services...')

        // Création du profil dans une transaction
        const result = await prisma.$transaction(async (tx) => {
          // Créer d'abord le profil professionnel
          const professional = await tx.professional.create({
            data: {
              userId: userBefore.id,
              type: mapToProfessionalType(data.activity?.type || "OTHER"),
              otherTypeDetails: data.activity?.otherTypeDetails,
              yearsExperience: data.activity?.experience || 0,
              phone: data.personalInfo.phone,
              address: data.personalInfo.address,
              city: data.personalInfo.city,
              postalCode: data.personalInfo.postalCode,
              bio: data.bio?.bio,
              description: data.bio?.approach,
              autoConfirmBookings: false,
              languages: ["fr"],
              notifications: {
                create: {
                  emailEnabled: data.preferences.notifications.email.bookingConfirmation,
                  smsEnabled: data.preferences.notifications.sms.bookingConfirmation,
                }
              }
            },
          })

          console.log('🟦 [API] Profil professionnel créé, ID:', professional.id)

          // Créer les services si fournis
          if (data.services?.services && data.services.services.length > 0) {
            console.log('🟦 [API] Création de', data.services.services.length, 'service(s)...')
            
            const servicePromises = data.services.services.map(async (serviceData, index) => {
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
            
            // Retourner le professionnel avec ses services
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
        if (data.personalInfo.name) {
          await prisma.user.update({
            where: { id: userBefore.id },
            data: { name: data.personalInfo.name }
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

    // Traitement pour les clients (inchangé)
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

        return NextResponse.json({ 
          success: true,
          data: result,
          redirect: "/tableau-de-bord?fromOnboarding=true"
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
      error: "Type de profil non supporté" 
    }, { status: 400 })

  } catch (error) {
    console.error('🔴 [API] Erreur détaillée:', error)
    
    if (error instanceof z.ZodError) {
      console.error('🔴 [API] Erreurs de validation:', error.errors)
      return NextResponse.json({
        success: false,
        error: "Données invalides",
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}