// src/app/api/reservations/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { Resend } from 'resend'
import { EmailTemplates } from "@/lib/emails/email-template"

const resend = new Resend(process.env.RESEND_API_KEY)

// Schéma de validation pour la création d'une réservation
const reservationSchema = z.object({
  professionalId: z.string().min(1, "ID du professionnel requis"),
  serviceId: z.string().min(1, "ID du service requis"),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone requis"),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Vérifier si l'utilisateur est connecté
    const session = await auth()
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = reservationSchema.parse(body)
    
    // Récupérer le professionnel
    const professional = await prisma.professional.findFirst({
      where: { 
        userId: validatedData.professionalId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer le service
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId }
    })
    
    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      )
    }
    
    // Créer ou récupérer le client
    let client
    let user
    
    if (session?.user) {
      // Si l'utilisateur est connecté, utiliser son profil
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { clientProfile: true }
      })
      
      if (user?.clientProfile) {
        client = user.clientProfile
      } else {
        // Créer un profil client si nécessaire
        client = await prisma.client.create({
          data: {
            userId: user!.id,
            phone: validatedData.phone,
            preferredLanguage: "fr"
          }
        })
        
        // Mettre à jour le flag hasProfile si nécessaire
        if (!user?.hasProfile) {
          await prisma.user.update({
            where: { id: user!.id },
            data: { hasProfile: true }
          })
        }
      }
    } else {
      // Si l'utilisateur n'est pas connecté, chercher un utilisateur existant par email
      user = await prisma.user.findUnique({
        where: { email: validatedData.email },
        include: { clientProfile: true }
      })
      
      if (user?.clientProfile) {
        client = user.clientProfile
      } else if (user) {
        // Créer un profil client pour l'utilisateur existant
        client = await prisma.client.create({
          data: {
            userId: user.id,
            phone: validatedData.phone,
            preferredLanguage: "fr"
          }
        })
        
        // Mettre à jour le flag hasProfile si nécessaire
        if (!user.hasProfile) {
          await prisma.user.update({
            where: { id: user.id },
            data: { hasProfile: true }
          })
        }
      } else {
        // Créer un nouvel utilisateur et un profil client
        user = await prisma.user.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            role: "CLIENT",
            hasProfile: true
          }
        })
        
        client = await prisma.client.create({
          data: {
            userId: user.id,
            phone: validatedData.phone,
            preferredLanguage: "fr"
          }
        })
      }
    }
    
    // Vérifier la disponibilité du créneau
    const startDateTime = new Date(`${validatedData.date}T${validatedData.startTime}:00`)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + service.duration)
    
    // Ajouter le temps tampon si configuré
    if (professional.bufferTime) {
      endDateTime.setMinutes(endDateTime.getMinutes() + professional.bufferTime)
    }
    
    // Vérifier s'il existe des rendez-vous qui chevauchent cette plage horaire
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        OR: [
          // Cas 1: Un rendez-vous existant commence pendant notre plage
          {
            startTime: {
              gte: startDateTime,
              lt: endDateTime
            }
          },
          // Cas 2: Un rendez-vous existant se termine pendant notre plage
          {
            endTime: {
              gt: startDateTime,
              lte: endDateTime
            }
          },
          // Cas 3: Un rendez-vous existant couvre entièrement notre plage
          {
            startTime: {
              lte: startDateTime
            },
            endTime: {
              gte: endDateTime
            }
          }
        ],
        status: {
          notIn: ["CANCELLED"]
        }
      }
    })
    
    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { 
          error: "Ce créneau n'est plus disponible", 
          message: "Ce créneau a été réservé entre temps. Veuillez en choisir un autre."
        },
        { status: 409 } // 409 Conflict
      )
    }
    
    // Créer la réservation
    const booking = await prisma.booking.create({
      data: {
        startTime: startDateTime,
        endTime: endDateTime,
        status: professional.autoConfirmBookings ? "CONFIRMED" : "PENDING",
        paymentStatus: "PENDING",
        notes: validatedData.notes || null,
        serviceId: service.id,
        clientId: client.id,
        professionalId: professional.id,
      }
    })
    
    // Envoyer un email de confirmation au client
    await resend.emails.send({
        from: 'SereniBook <onboarding@resend.dev>',
        to: validatedData.email,
        subject: 'Confirmation de votre réservation - SereniBook',
        html: EmailTemplates.appointmentConfirmation({
          clientName: validatedData.name,
          serviceName: service.name,
          date: new Date(validatedData.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          time: validatedData.startTime,
          professionalName: professional.user.name || 'Votre praticien'  // Valeur par défaut si name est null
        })
      })
    
    // Envoyer un email de notification au professionnel
    await resend.emails.send({
        from: 'SereniBook <onboarding@resend.dev>',
        to: professional.user.email!,
        subject: 'Nouvelle réservation - SereniBook',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #67B3AB;">Nouvelle réservation</h1>
            <p>Bonjour ${professional.user.name},</p>
            <p>Vous avez reçu une nouvelle réservation de <strong>${validatedData.name}</strong>.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Service :</strong> ${service.name}</p>
              <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date(validatedData.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Heure :</strong> ${validatedData.startTime}</p>
              <p style="margin: 5px 0;"><strong>Client :</strong> ${validatedData.name}</p>
              <p style="margin: 5px 0;"><strong>Email :</strong> ${validatedData.email}</p>
              <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${validatedData.phone}</p>
              ${validatedData.notes ? `<p style="margin: 5px 0;"><strong>Notes :</strong> ${validatedData.notes}</p>` : ''}
            </div>
            <p>Vous pouvez gérer cette réservation depuis votre espace SereniBook.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/tableau-de-bord" style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accéder à mon tableau de bord</a>
            </div>
            <p>À bientôt,<br>L'équipe SereniBook</p>
          </div>
        `
      })
      
      return NextResponse.json({
        success: true,
        booking,
        message: "Réservation créée avec succès"
      })
        } catch (error) {
          console.error("Erreur dans POST /api/reservations:", error)
          
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