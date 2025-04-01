// src/app/api/auth/sync-session/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth.config"

// Créons un cache pour éviter les appels multiples
const processedRequests = new Set();

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const requestId = searchParams.get('requestId') || crypto.randomUUID();
    
    // Vérifier si cette requête a déjà été traitée récemment
    if (processedRequests.has(requestId)) {
      console.log(`🟨 [SYNC:${requestId}] Requête déjà traitée, ignorée`);
      return NextResponse.json({ 
        success: true,
        message: "Déjà traité",
        cached: true
      })
    }
    
    // Ajouter l'ID au cache
    processedRequests.add(requestId);
    
    // Supprimer l'ID après un délai
    setTimeout(() => {
      processedRequests.delete(requestId);
    }, 30000); // 30 secondes
    
    console.log(`🟦 [SYNC:${requestId}] Début synchronisation session pour userId: ${userId || 'non spécifié'}`);

    // Forcer la mise à jour de la session en invalidant la session actuelle
    const session = await auth();
    
    console.log(`🟦 [SYNC:${requestId}] Fin synchronisation session`);
    
    // Retourner un succès
    return NextResponse.json({ 
      success: true,
      message: "Session synchronisée",
      sessionUpdated: !!session,
      requestId
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    })
  } catch (error) {
    console.error(`🔴 [SYNC] Erreur:`, error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}