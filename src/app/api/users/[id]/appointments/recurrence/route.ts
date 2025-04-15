// src/app/api/users/[id]/appointments/recurrence/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import { z } from "zod"
import { BookingStatus, RecurrenceType } from "@prisma/client"
import { addDays, addWeeks, addMonths, getDay, getDate, set, parseISO } from "date-fns"

const recurrenceSchema = z.object({
  originalBookingId: z.string().min(1, "ID du rendez-vous original requis"),
  type: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  weekdays: z.array(z.string()).optional(),
  monthDay: z.number().optional(),
  endType: z.enum(["never", "after", "on"]),
  endAfter: z.number().optional(),
  endDate: z.string().optional(),
})

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
    
    // Récupérer et valider les données
    const body = await request.json()
    const validatedData = recurrenceSchema.parse(body)
    
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
    
    // Récupérer le rendez-vous original
    const originalBooking = await prisma.booking.findUnique({
      where: {
        id: validatedData.originalBookingId,
        professionalId: professional.id
      },
      include: {
        service: true
      }
    })
    
    if (!originalBooking) {
      return NextResponse.json(
        { error: "Rendez-vous original non trouvé" },
        { status: 404 }
      )
    }
    
    // Créer une règle de récurrence
    const recurrenceRule = await prisma.recurrenceRule.create({
      data: {
        bookingId: originalBooking.id,
        type: validatedData.type as RecurrenceType,
        interval: 1,
        weekdays: validatedData.weekdays ? validatedData.weekdays.map(d => parseInt(d)) : [],
        monthDay: validatedData.monthDay,
        endDate: validatedData.endType === "on" && validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        endAfter: validatedData.endType === "after" ? validatedData.endAfter : undefined,
      }
    })
    
    // Marquer le rendez-vous original comme récurrent
    await prisma.booking.update({
      where: { id: originalBooking.id },
      data: { isRecurring: true }
    })
    
    // Générer les occurrences de récurrence
    const occurrences = await generateRecurrenceOccurrences(
      originalBooking,
      recurrenceRule,
      professional.id
    )
    
    return NextResponse.json({
      success: true,
      recurrenceRule,
      occurrencesCount: occurrences.length
    })
  } catch (error) {
    console.error("Erreur dans POST /api/users/[id]/appointments/recurrence:", error)
    
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

// Fonction pour générer les occurrences de récurrence
async function generateRecurrenceOccurrences(
  originalBooking: any,
  recurrenceRule: any,
  professionalId: string
) {
  const occurrences = []
  const startDate = new Date(originalBooking.startTime)
  
  // Calculer la durée du rendez-vous (en millisecondes)
  const duration = new Date(originalBooking.endTime).getTime() - startDate.getTime()
  
  // Définir la date de fin en fonction des règles
  let endDate: Date | null = null
  if (recurrenceRule.endDate) {
    endDate = new Date(recurrenceRule.endDate)
  } else if (recurrenceRule.endAfter) {
    // Définie dynamiquement en fonction du nombre d'occurrences
    endDate = null
  } else {
    // Si aucune fin n'est spécifiée, générer pour les 3 prochains mois maximum
    endDate = addMonths(startDate, 3)
  }
  
  // Nombre maximum d'occurrences à générer
  const maxOccurrences = recurrenceRule.endAfter || 52 // Maximum 1 an par défaut
  
  // Date courante pour l'itération
  let currentDate = new Date(startDate)
  currentDate.setDate(currentDate.getDate() + 1) // Commencer au jour suivant
  
  // Occurrences créées
  let occurrencesCreated = 0
  
  // Fonction pour vérifier si un jour de la semaine est sélectionné
  const isDaySelected = (date: Date) => {
    const weekday = date.getDay()
    return recurrenceRule.weekdays.includes(weekday)
  }
  
  // Générer les occurrences
  while ((!endDate || currentDate <= endDate) && occurrencesCreated < maxOccurrences) {
    let shouldCreateOccurrence = false
    
    // Calculer la prochaine date selon le type de récurrence
    switch(recurrenceRule.type) {
      case "DAILY":
        shouldCreateOccurrence = true
        break
        
      case "WEEKLY":
        shouldCreateOccurrence = recurrenceRule.weekdays.length > 0 
          ? isDaySelected(currentDate)
          : currentDate.getDay() === startDate.getDay()
        break
        
      case "BIWEEKLY":
        // Vérifier si on est à un intervalle de 2 semaines
        const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        if (weeksDiff % 2 === 0) {
          shouldCreateOccurrence = recurrenceRule.weekdays.length > 0 
            ? isDaySelected(currentDate)
            : currentDate.getDay() === startDate.getDay()
        }
        break
        
      case "MONTHLY":
        // Soit le même jour du mois, soit le jour spécifié
        const targetDay = recurrenceRule.monthDay || startDate.getDate()
        shouldCreateOccurrence = currentDate.getDate() === targetDay
        break
    }
    
    if (shouldCreateOccurrence) {
      // Créer une nouvelle occurrence à l'heure correspondante
      const newStartTime = new Date(currentDate)
      newStartTime.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)
      
      const newEndTime = new Date(newStartTime.getTime() + duration)
      
      // Vérifier les conflits avec d'autres rendez-vous
      const hasConflict = await checkTimeConflict(
        newStartTime,
        newEndTime,
        professionalId
      )
      
      if (!hasConflict) {
        // Créer la nouvelle occurrence
        try {
          const newOccurrence = await prisma.booking.create({
            data: {
              startTime: newStartTime,
              endTime: newEndTime,
              status: originalBooking.status,
              paymentStatus: originalBooking.paymentStatus,
              notes: originalBooking.notes,
              serviceId: originalBooking.serviceId,
              clientId: originalBooking.clientId,
              professionalId: professionalId,
              isRecurring: true,
              parentBookingId: originalBooking.id,
              parentRecurrenceId: recurrenceRule.id
            }
          })
          
          occurrences.push(newOccurrence)
          occurrencesCreated++
        } catch (error) {
          console.error("Erreur lors de la création d'une occurrence:", error)
        }
      }
    }
    
    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return occurrences
}

// Fonction pour vérifier les conflits d'horaire
async function checkTimeConflict(
  startTime: Date,
  endTime: Date,
  professionalId: string
) {
  // Chercher les rendez-vous qui se chevauchent avec cette période
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      professionalId,
      OR: [
        // Commence pendant un autre rendez-vous
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime }
        },
        // Finit pendant un autre rendez-vous
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime }
        },
        // Englobe complètement un autre rendez-vous
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime }
        }
      ]
    }
  })
  
  return overlappingBookings.length > 0
}