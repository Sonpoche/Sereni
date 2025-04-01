// src/app/api/users/[id]/availability/[availabilityId]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schéma de validation pour la mise à jour de créneau horaire
const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  dayOfWeek: z.number().min(0).max(6),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, availabilityId: string } }
) {
  try {
    const { id: userId, availabilityId } = params
    
    console.log(`PATCH: userId=${userId}, availabilityId=${availabilityId}`);
    
    // Vérifier l'authentification
    const session = await auth()
    if (!session?.user?.id || (session.user.id !== userId)) {
      console.error("Erreur d'authentification:", session?.user?.id, userId);
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Récupérer et valider les données
    const body = await request.json()
    console.log("Données reçues:", body);
    
    const validatedData = timeSlotSchema.parse(body)
    console.log("Données validées:", validatedData);
    
    // Récupérer le profil professionnel
    const professional = await prisma.professional.findUnique({
      where: { userId },
    })
    
    if (!professional) {
      console.error("Profil professionnel non trouvé");
      return NextResponse.json(
        { error: "Profil professionnel non trouvé" },
        { status: 404 }
      )
    }
    
    // Vérifier que le créneau appartient au praticien
    const timeSlot = await prisma.availability.findUnique({
      where: { id: availabilityId },
    })
    
    if (!timeSlot) {
      console.error("Créneau non trouvé");
      return NextResponse.json(
        { error: "Créneau horaire non trouvé" },
        { status: 404 }
      )
    }
    
    if (timeSlot.professionalId !== professional.id) {
      console.error("Créneau non autorisé:", timeSlot.professionalId, professional.id);
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce créneau" },
        { status: 403 }
      )
    }
    
    console.log(`Mise à jour du créneau ${availabilityId}:`);
    console.log(`- Jour: ${timeSlot.dayOfWeek} --> ${validatedData.dayOfWeek}`);
    console.log(`- Heure de début: ${timeSlot.startTime} --> ${validatedData.startTime}`);
    console.log(`- Heure de fin: ${timeSlot.endTime} --> ${validatedData.endTime}`);
    
    // Mettre à jour le créneau horaire avec le jour explicitement défini
    const updatedTimeSlot = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        dayOfWeek: validatedData.dayOfWeek,
      }
    })
    
    console.log("Créneau mis à jour:", updatedTimeSlot);
    
    return NextResponse.json(updatedTimeSlot)
  } catch (error) {
    console.error("Erreur dans PATCH /api/users/[id]/availability/[availabilityId]:", error)
    
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, availabilityId: string } }
) {
  try {
    const { id: userId, availabilityId } = params
    
    console.log(`DELETE: userId=${userId}, availabilityId=${availabilityId}`);
    
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
    
    // Vérifier que le créneau appartient au praticien
    const timeSlot = await prisma.availability.findUnique({
      where: { id: availabilityId },
    })
    
    if (!timeSlot || timeSlot.professionalId !== professional.id) {
      return NextResponse.json(
        { error: "Créneau horaire non trouvé ou non autorisé" },
        { status: 404 }
      )
    }
    
    // Supprimer le créneau horaire
    await prisma.availability.delete({
      where: { id: availabilityId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur dans DELETE /api/users/[id]/availability/[availabilityId]:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}