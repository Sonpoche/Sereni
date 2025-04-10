// src/app/api/users/[id]/clients/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"
import { Resend } from 'resend'
import { EmailTemplates } from "@/lib/emails/email-template"
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

// Schéma pour la création d'un client
const createClientSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  sendInvitation: z.boolean().default(true)
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    console.log("Récupération des clients pour le professionnel:", professional.id)
    
    // Approche 1: Clients qui ont des rendez-vous avec ce professionnel
    const bookingClients = await prisma.booking.findMany({
      where: { professionalId: professional.id },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      distinct: ['clientId']
    })
    
    console.log("Clients trouvés via bookings:", bookingClients.length)
    
    // Approche 2: Clients directement liés à ce professionnel via ProfessionalClient
    const linkedClients = await prisma.professionalClient.findMany({
      where: { professionalId: professional.id },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
    
    console.log("Clients trouvés via ProfessionalClient:", linkedClients.length)
    
    // Fusionner les listes et supprimer les doublons
    const clientsMap = new Map()
    
    // Ajouter les clients avec rendez-vous
    bookingClients.forEach(booking => {
      if (booking.client && booking.client.user) {
        clientsMap.set(booking.client.id, {
          id: booking.client.id,
          user: {
            name: booking.client.user.name,
            email: booking.client.user.email
          },
          phone: booking.client.phone,
          address: booking.client.address,
          city: booking.client.city,
          postalCode: booking.client.postalCode,
          notes: booking.client.notes,
          createdAt: booking.client.createdAt.toISOString(),
          appointmentsCount: 1, // On pourrait calculer cela plus précisément
          lastAppointment: booking.startTime.toISOString()
        })
      }
    })
    
    // Ajouter les clients liés directement
    linkedClients.forEach(link => {
      if (link.client && link.client.user) {
        // Si le client existe déjà, on ne l'écrase pas pour garder les infos de rendez-vous
        if (!clientsMap.has(link.client.id)) {
          clientsMap.set(link.client.id, {
            id: link.client.id,
            user: {
              name: link.client.user.name,
              email: link.client.user.email
            },
            phone: link.client.phone,
            address: link.client.address,
            city: link.client.city,
            postalCode: link.client.postalCode,
            notes: link.client.notes,
            createdAt: link.client.createdAt.toISOString(),
            appointmentsCount: 0,
            lastAppointment: null
          })
        }
      }
    })
    
    // Convertir la Map en array
    const clients = Array.from(clientsMap.values())
    console.log("Nombre total de clients uniques:", clients.length)
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Erreur dans GET /api/users/[id]/clients:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)
    
    console.log("Création d'un client avec les données:", validatedData)
    
    // Vérifier si un utilisateur avec cet email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { clientProfile: true }
    })
    
    let client
    
    if (existingUser) {
      console.log("Utilisateur existant trouvé:", existingUser.id)
      // Si l'utilisateur existe mais n'a pas de profil client, on lui en crée un
      if (!existingUser.clientProfile) {
        console.log("Création d'un profil client pour l'utilisateur existant")
        client = await prisma.client.create({
          data: {
            userId: existingUser.id,
            phone: validatedData.phone,
            address: validatedData.address,
            postalCode: validatedData.postalCode,
            city: validatedData.city,
            preferredLanguage: "fr"
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      } else {
        // Si l'utilisateur a déjà un profil client, on l'utilise
        console.log("Utilisation du profil client existant")
        client = await prisma.client.findUnique({
          where: { userId: existingUser.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      }
    } else {
      // Si l'utilisateur n'existe pas, on crée un nouvel utilisateur et un profil client
      console.log("Création d'un nouvel utilisateur et d'un profil client")
      const newUser = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          role: "CLIENT",
          hasProfile: true
        }
      })
      
      client = await prisma.client.create({
        data: {
          userId: newUser.id,
          phone: validatedData.phone,
          address: validatedData.address,
          postalCode: validatedData.postalCode,
          city: validatedData.city,
          preferredLanguage: "fr"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      
      // Si demandé, envoyer une invitation au client
      if (validatedData.sendInvitation) {
        console.log("Envoi d'une invitation au client")
        // Générer un token unique pour l'invitation
        const invitationToken = crypto.randomBytes(32).toString('hex')
        
        // Stocker le token dans la base de données
        await prisma.invitationToken.create({
          data: {
            token: invitationToken,
            email: validatedData.email,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            professionalId: professional.id
          }
        })
        
        // URL d'invitation
        const invitationUrl = `${process.env.NEXTAUTH_URL}/invitation?token=${invitationToken}`
        
        // Obtenir le nom du professionnel
        const professionalUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        })
        
        // Envoyer l'email d'invitation
        await resend.emails.send({
          from: 'SereniBook <onboarding@resend.dev>',
          to: validatedData.email,
          subject: 'Invitation à rejoindre SereniBook',
          html: EmailTemplates.invitationEmail({
            clientName: validatedData.name,
            professionalName: professionalUser?.name || 'votre praticien',
            url: invitationUrl,
            isNewAppointment: false
          })
        })
      }
    }
    
    // S'assurer que le client n'est pas null
    if (!client) {
      throw new Error("Erreur lors de la création ou récupération du client")
    }
    
    // Enregistrer que ce client a été créé par ce professionnel
    // même s'il n'y a pas encore de rendez-vous
    try {
      console.log("Création d'une association ProfessionalClient entre", professional.id, "et", client.id)
      await prisma.professionalClient.create({
        data: {
          professionalId: professional.id,
          clientId: client.id,
          createdAt: new Date(),
        }
      })
      console.log("Association ProfessionalClient créée avec succès")
    } catch (e) {
      // Ignorer l'erreur si l'association existe déjà (contrainte d'unicité)
      console.log("Note: Client déjà associé au professionnel ou erreur:", e)
    }
    
    // Formater la réponse pour qu'elle corresponde à la structure utilisée par le GET
    const clientData = {
      id: client.id,
      user: {
        name: client.user.name,
        email: client.user.email
      },
      phone: client.phone,
      address: client.address || undefined,
      city: client.city || undefined,
      postalCode: client.postalCode || undefined,
      notes: client.notes || undefined,
      createdAt: client.createdAt.toISOString(),
      appointmentsCount: 0,
      lastAppointment: null
    }
    
    console.log("Client créé/récupéré avec succès:", clientData)
    return NextResponse.json(clientData)
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/clients:", error)
    
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