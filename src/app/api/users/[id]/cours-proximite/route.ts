// src/app/api/users/[id]/cours-proximite/route.ts (correction)
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { geocodeAddress, calculateDistance } from "@/lib/utils/geocoding"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le profil client avec sa localisation
    const client = await prisma.client.findUnique({
      where: { userId: params.id },
      include: { user: true }
    })

    if (!client) {
      return NextResponse.json({ 
        courses: [],
        message: "Profil client non trouvé"
      })
    }

    if (!client.city) {
      return NextResponse.json({ 
        courses: [],
        message: "Veuillez compléter votre adresse pour voir les cours à proximité"
      })
    }

    // Géocoder l'adresse du client si pas encore fait
    let clientLat = client.latitude
    let clientLng = client.longitude
    
    if (!clientLat || !clientLng) {
      const coords = await geocodeAddress(`${client.city}, ${client.postalCode || ''} France`)
      if (coords) {
        clientLat = coords.latitude
        clientLng = coords.longitude
        
        // Mettre à jour les coordonnées du client
        try {
          await prisma.client.update({
            where: { id: client.id },
            data: { 
              latitude: clientLat, 
              longitude: clientLng 
            }
          })
        } catch (updateError) {
          // Continuer même si la sauvegarde échoue
        }
      }
    }

    // Vérifier si le nouveau système existe
    let useNewSystem = true;
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "GroupClass" LIMIT 1`;
    } catch (error) {
      useNewSystem = false;
    }

    let groupClasses: any[] = [];

    if (useNewSystem) {
      // NOUVEAU SYSTÈME : Utiliser GroupClass
      groupClasses = await prisma.groupClass.findMany({
        where: { active: true },
        include: {
          professional: {
            include: {
              user: {
                select: { name: true, id: true }
              }
            }
          },
          sessions: {
            where: {
              startTime: { gte: new Date() },
              status: "SCHEDULED"
            },
            orderBy: { startTime: 'asc' },
            take: 3,
            include: {
              registrations: {
                select: { id: true }
              }
            }
          }
        }
      })
    } else {
      // ANCIEN SYSTÈME : Utiliser Booking avec isGroupClass
      const existingGroupClasses = await prisma.booking.findMany({
        where: {
          isGroupClass: true,
          startTime: { gte: new Date() },
          status: { not: "CANCELLED" }
        },
        include: {
          service: true,
          professional: {
            include: {
              user: {
                select: { name: true, id: true }
              }
            }
          },
          groupParticipants: {
            select: { id: true }
          }
        },
        orderBy: { startTime: 'asc' }
      })

      // Convertir au format attendu
      groupClasses = existingGroupClasses.map(booking => ({
        id: booking.id,
        name: booking.service.name,
        description: booking.service.description || '',
        price: Number(booking.service.price),
        duration: booking.service.duration,
        maxParticipants: booking.maxParticipants,
        isOnline: false,
        city: booking.professional.city || '',
        postalCode: booking.professional.postalCode || '', // AJOUT de cette ligne
        latitude: booking.professional.latitude,
        longitude: booking.professional.longitude,
        professional: booking.professional,
        sessions: [{
          id: booking.id,
          startTime: booking.startTime,
          registrations: booking.groupParticipants || []
        }]
      }))
    }

    // Si aucun cours collectif n'existe
    if (groupClasses.length === 0) {
      return NextResponse.json({
        courses: [],
        message: "Aucun cours collectif n'est disponible pour le moment.",
        clientLocation: { city: client.city, distance: client.maxDistance || 25 }
      })
    }

    // Filtrer par distance et ajouter les infos de proximité
    const maxDistance = client.maxDistance || 25
    const nearbyClasses = []

    for (const groupClass of groupClasses) {
      let distance = null
      let showClass = false

      // Cours en ligne - toujours inclus si activé
      if (groupClass.isOnline && client.showOnlineCourses) {
        showClass = true
      }
      // Si on a des coordonnées client et cours
      else if (clientLat && clientLng && groupClass.latitude && groupClass.longitude) {
        distance = calculateDistance(
          clientLat, clientLng,
          groupClass.latitude, groupClass.longitude
        )
        showClass = distance <= maxDistance
      }
      // Si pas de coordonnées pour le cours, essayer de géocoder
      else if (groupClass.city) {
        try {
          // CORRECTION : Utiliser une adresse construite selon le système
          let addressToGeocode = '';
          
          if (useNewSystem) {
            // Nouveau système : utiliser l'adresse du cours
            addressToGeocode = `${groupClass.address || ''} ${groupClass.city}, ${groupClass.postalCode || ''} France`;
          } else {
            // Ancien système : utiliser l'adresse du professionnel
            addressToGeocode = `${groupClass.professional.address || ''} ${groupClass.city}, ${groupClass.postalCode || ''} France`;
          }
          
          const courseCoords = await geocodeAddress(addressToGeocode)
          if (courseCoords && clientLat && clientLng) {
            // Mettre à jour les coordonnées du cours si c'est le nouveau système
            if (useNewSystem) {
              await prisma.groupClass.update({
                where: { id: groupClass.id },
                data: {
                  latitude: courseCoords.latitude,
                  longitude: courseCoords.longitude
                }
              })
            }
            // Pour l'ancien système, on ne met pas à jour la base
            
            distance = calculateDistance(
              clientLat, clientLng,
              courseCoords.latitude, courseCoords.longitude
            )
            showClass = distance <= maxDistance
            
            // Mettre à jour l'objet avec les nouvelles coordonnées
            groupClass.latitude = courseCoords.latitude
            groupClass.longitude = courseCoords.longitude
          } else {
            // Fallback: inclure si même ville
            showClass = groupClass.city.toLowerCase().trim() === client.city?.toLowerCase().trim()
            distance = 0
          }
        } catch (geocodeError) {
          // Fallback: inclure si même ville
          showClass = groupClass.city?.toLowerCase().trim() === client.city?.toLowerCase().trim()
          distance = 0
        }
      }
      // Dernier recours: comparer les villes directement
      else {
        showClass = groupClass.city?.toLowerCase().trim() === client.city?.toLowerCase().trim()
        distance = 0
      }

      if (showClass) {
        nearbyClasses.push({
          ...groupClass,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          availablePlaces: useNewSystem 
            ? groupClass.sessions.reduce((total: number, session: any) => {
                return total + (groupClass.maxParticipants - session.registrations.length)
              }, 0)
            : groupClass.maxParticipants - (groupClass.sessions[0]?.registrations?.length || 0)
        })
      }
    }

    // Trier par distance (cours sans distance à la fin)
    nearbyClasses.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })

    return NextResponse.json({
      courses: nearbyClasses.slice(0, 6), // Limiter à 6 cours
      clientLocation: { city: client.city, distance: maxDistance }
    })

  } catch (error) {
    console.error("Erreur dans l'API cours-proximite:", error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur",
        message: "Une erreur s'est produite lors de la recherche des cours"
      },
      { status: 500 }
    )
  }
}