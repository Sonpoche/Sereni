// src/app/api/professionnels/[id]/disponibilites/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { parse, format, setHours, setMinutes, addMinutes } from "date-fns"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const dateStr = searchParams.get('date')
    
    if (!serviceId || !dateStr) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      )
    }
    
    const userId = params.id
    
    // Récupérer le professionnel
    const professional = await prisma.professional.findFirst({
      where: { 
        userId: userId,
        user: {
          hasProfile: true
        }
      },
    })
    
    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer le service pour connaître sa durée
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })
    
    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      )
    }
    
    // Récupérer les disponibilités du professionnel pour ce jour de la semaine
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay() // 0 pour dimanche, 1 pour lundi, etc.
    
    const availabilities = await prisma.availability.findMany({
      where: {
        professionalId: professional.id,
        dayOfWeek: dayOfWeek
      }
    })
    
    if (availabilities.length === 0) {
      return NextResponse.json({ availableTimes: [] })
    }
    
    // Récupérer les rendez-vous déjà pris à cette date
    const bookings = await prisma.booking.findMany({
      where: {
        professionalId: professional.id,
        startTime: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lt: new Date(`${dateStr}T23:59:59.999Z`)
        },
        status: {
          notIn: ["CANCELLED"]
        }
      }
    })
    
    // Calculer les créneaux disponibles
    const availableTimes: string[] = []
    
    for (const availability of availabilities) {
      // Parser les heures de début et de fin
      const [startHour, startMinute] = availability.startTime.split(':').map(Number)
      const [endHour, endMinute] = availability.endTime.split(':').map(Number)
      
      // Convertir en objets Date
      let currentSlot = new Date(dateStr)
      currentSlot.setHours(startHour, startMinute, 0, 0)
      
      const endTime = new Date(dateStr)
      endTime.setHours(endHour, endMinute, 0, 0)
      
      // Tenir compte du temps tampon entre les rendez-vous
      const bufferTime = professional.bufferTime || 0
      const totalSlotDuration = service.duration + bufferTime
      
      // Générer des créneaux jusqu'à l'heure de fin
      while (addMinutes(currentSlot, totalSlotDuration) <= endTime) {
        const slotEndTime = addMinutes(currentSlot, service.duration)
        
        // Vérifier si ce créneau est déjà pris
        const isBooked = bookings.some(booking => {
          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          
          // Chevauchement si
          // (début du créneau < fin du rendez-vous) ET (fin du créneau > début du rendez-vous)
          return (currentSlot < bookingEnd && slotEndTime > bookingStart)
        })
        
        if (!isBooked) {
          availableTimes.push(format(currentSlot, 'HH:mm'))
        }
        
        // Passer au créneau suivant (intervalles de 15 minutes)
        currentSlot = addMinutes(currentSlot, 15)
      }
    }
    
    return NextResponse.json({ availableTimes })
  } catch (error) {
    console.error("Erreur dans GET /api/professionnels/[id]/disponibilites:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}