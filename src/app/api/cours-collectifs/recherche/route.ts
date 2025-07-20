// src/app/api/cours-collectifs/recherche/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Cette API est maintenant redirigée vers l'API principale
// pour maintenir la compatibilité avec d'éventuels appels existants
export async function GET(request: NextRequest) {
  try {
    // Rediriger vers l'API principale
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Construire la nouvelle URL
    const newUrl = new URL('/api/cours-collectifs', url.origin);
    
    // Copier tous les paramètres
    searchParams.forEach((value, key) => {
      newUrl.searchParams.set(key, value);
    });
    
    console.log(`🔄 Redirection de /recherche vers API principale: ${newUrl.toString()}`);
    
    // Faire un appel interne à l'API principale
    const response = await fetch(newUrl.toString());
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erreur dans GET /api/cours-collectifs/recherche:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}