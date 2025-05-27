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
    
    // Lecture utilisateur avec les profils détaillés pour récupérer le téléphone
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
          select: { 
            id: true,
            phone: true  // Récupérer le téléphone du profil professionnel
          }
        },
        clientProfile: {
          select: { 
            id: true,
            phone: true  // Récupérer le téléphone du profil client
          }
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

    // Récupérer le téléphone depuis le bon profil selon le rôle
    let phone = "";
    if (user.professionalProfile?.phone) {
      phone = user.professionalProfile.phone;
    } else if (user.clientProfile?.phone) {
      phone = user.clientProfile.phone;
    }

    console.log(`🟦 [API:${requestId}] Données utilisateur récupérées:`, {
      id: user.id,
      hasProfile: user.hasProfile,
      isFirstVisit: user.isFirstVisit,
      emailVerified: user.emailVerified,
      hasProProfile: !!user.professionalProfile,
      hasClientProfile: !!user.clientProfile,
      phone: phone ? "présent" : "absent"
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

    // Retourner les données utilisateur avec le téléphone
    const userData = {
      ...user,
      phone: phone  // Ajouter le téléphone au niveau racine
    };

    console.log(`🟦 [API:${requestId}] Fin requête utilisateur ${userId}`);
    return NextResponse.json(userData, { headers })
  } catch (error) {
    console.error(`🔴 [API:${requestId}] Erreur:`, error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}