// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Utiliser une chaîne vide comme valeur par défaut si params.id est undefined
  const userId = params?.id || "";
  const requestId = crypto.randomUUID().slice(0, 8);
  
  console.log(`🟦 [API:${requestId}] Début requête GET /api/users/${userId}`);

  try {
    // Vérifier que l'ID est valide
    if (!userId) {
      console.log(`🔴 [API:${requestId}] ID utilisateur manquant`);
      return NextResponse.json(
        { error: "ID utilisateur manquant" }, 
        { status: 400 }
      )
    }
    
    // Vérifier si nous devons vérifier spécifiquement l'email
    const { searchParams } = new URL(request.url)
    const checkEmail = searchParams.get('check') === 'emailVerified'
    
    // Ajouter un en-tête pour éviter la mise en cache
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, max-age=0');
    
    // Lecture utilisateur
    console.log(`🟦 [API:${requestId}] Recherche utilisateur ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hasProfile: true,
        isFirstVisit: true,
        emailVerified: true,
        professionalProfile: {
          select: { id: true }
        },
        clientProfile: {
          select: { id: true }
        }
      }
    })

    if (!user) {
      console.log(`🔴 [API:${requestId}] Utilisateur non trouvé`);
      return NextResponse.json(
        { error: "Utilisateur non trouvé" }, 
        { status: 404, headers }
      )
    }

    console.log(`🟦 [API:${requestId}] Données utilisateur récupérées:`, {
      id: user.id,
      hasProfile: user.hasProfile,
      isFirstVisit: user.isFirstVisit,
      emailVerified: user.emailVerified,
      hasProProfile: !!user.professionalProfile,
      hasClientProfile: !!user.clientProfile
    })

    // Si nous vérifions spécifiquement l'email, retourner un résultat simplifié
    if (checkEmail) {
      console.log(`🟦 [API:${requestId}] Vérification email: ${user.emailVerified ? 'vérifié' : 'non vérifié'}`);
      return NextResponse.json({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified ? true : false
      }, { headers })
    }

    console.log(`🟦 [API:${requestId}] Fin requête utilisateur ${userId}`);
    return NextResponse.json(user, { headers })
  } catch (error) {
    console.error(`🔴 [API:${requestId}] Erreur:`, error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}