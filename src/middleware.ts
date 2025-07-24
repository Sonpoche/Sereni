// src/middleware.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth.config"

// Chemins publics (toujours accessibles)
const publicPaths = [
  "/", 
  "/connexion", 
  "/inscription", 
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/about", 
  "/contact",
  "/cours-collectifs",
  "/recherche",
  "/tarifs",
  "/choix-abonnement",
  "/inscription-reussie"
]

// Pages qui requièrent une authentification
const protectedPaths = [
  "/tableau-de-bord", 
  "/profil", 
  "/rendez-vous", 
  "/mes-rendez-vous",
  "/clients", 
  "/services",
  "/mes-cours-collectifs",
  "/factures", // Pour les professionnels
  "/mes-factures", // NOUVEAU : Pour les clients
  "/parametres"
]

// Pages qui ne nécessitent pas un profil complet (en plus des publicPaths)
const allowedIncompleteProfilePaths = [
  "/onboarding",  // ✅ CHANGEMENT : onboarding au lieu de profil/completer
  "/api/",
  "/inscription-reussie"
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  console.log(`🔄 [Middleware] Chemin: ${pathname}`)

  // ✅ NOUVEAU : Rediriger /profil/completer vers /onboarding
  if (pathname.startsWith('/profil/completer')) {
    console.log(`🔄 [Middleware] Redirection /profil/completer -> /onboarding`)
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Vérifier si le chemin actuel est public - FIX: comparaison exacte pour "/"
  const isPublicPath = publicPaths.some(path => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  })

  // Vérifier si le chemin actuel est protégé
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

  // Vérifier si c'est un chemin autorisé pour profil incomplet
  const isAllowedIncompleteProfilePath = allowedIncompleteProfilePaths.some(path => 
    pathname.startsWith(path)
  )

  // Obtenir la session
  const session = await auth()

  if (session) {
    console.log(`🔄 [Middleware] Utilisateur: ${session.user.email}, hasProfile: ${session.user.hasProfile}`)
  }

  // ✅ MODIFICATION : Protection pour /onboarding au lieu de /profil/completer
  if (pathname === "/onboarding") {
    if (!session) {
      // Utilisateur non connecté : vérifier qu'il y a les bons paramètres
      const role = request.nextUrl.searchParams.get('role')
      const flow = request.nextUrl.searchParams.get('flow')
      
      if (!role) {
        console.log(`🔄 [Middleware] Redirection vers inscription - paramètres manquants`)
        return NextResponse.redirect(new URL("/inscription", request.url))
      }
      
      console.log(`🔄 [Middleware] Accès autorisé à onboarding (nouveau utilisateur)`)
      return NextResponse.next()
    }

    // Utilisateur connecté : si profil complet, rediriger vers tableau de bord
    if (session.user.hasProfile) {
      console.log(`🔄 [Middleware] Redirection vers tableau-de-bord - profil complet`)
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url))
    }

    console.log(`🔄 [Middleware] Accès autorisé à onboarding (complétion de profil)`)
    return NextResponse.next()
  }

  // Protection spéciale pour inscription-reussie (retour de Stripe)
  if (pathname === "/inscription-reussie") {
    if (!session) {
      console.log(`🔄 [Middleware] Redirection vers connexion - page succès non connecté`)
      return NextResponse.redirect(new URL("/connexion", request.url))
    }

    console.log(`🔄 [Middleware] Accès autorisé à inscription-reussie`)
    return NextResponse.next()
  }

  // Si l'utilisateur est sur une page publique et est connecté
  if (session && (pathname === "/connexion" || pathname === "/inscription")) {
    // Si profil incomplet, rediriger vers onboarding
    if (!session.user.hasProfile) {
      console.log(`🔄 [Middleware] Redirection vers onboarding - depuis page publique`)
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
    
    // Vérifier d'abord si on est dans un flow de retour Stripe
    const isInSubscriptionFlow = request.nextUrl.searchParams.get('success') === 'true' || 
                                request.nextUrl.searchParams.get('session_id')
    
    if (pathname === "/inscription" && isInSubscriptionFlow) {
      console.log(`🔄 [Middleware] Redirection vers inscription-reussie - retour Stripe`)
      return NextResponse.redirect(new URL("/inscription-reussie" + request.nextUrl.search, request.url))
    }
    
    // Sinon rediriger vers tableau de bord
    console.log(`🔄 [Middleware] Redirection vers tableau-de-bord - déjà connecté`)
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url))
  }

  // Si l'utilisateur est sur une page protégée et n'est pas connecté
  if (!session && isProtectedPath) {
    let callbackUrl = pathname
    if (request.nextUrl.search) {
      callbackUrl += request.nextUrl.search
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    console.log(`🔄 [Middleware] Redirection vers connexion - page protégée`)
    return NextResponse.redirect(
      new URL(`/connexion?callbackUrl=${encodedCallbackUrl}`, request.url)
    )
  }

  // 🔥 NOUVEAU : Vérifications spéciales pour les routes de facturation
  if (session?.user) {
    const user = session.user

    // Seuls les professionnels peuvent accéder à /factures
    if (pathname.startsWith('/factures')) {
      if (user.role !== 'PROFESSIONAL') {
        console.log(`🔄 [Middleware] Accès factures refusé (rôle: ${user.role})`)
        return NextResponse.redirect(new URL('/tableau-de-bord', request.url))
      }
    }

    // Seuls les clients peuvent accéder à /mes-factures
    if (pathname.startsWith('/mes-factures')) {
      if (user.role !== 'CLIENT') {
        console.log(`🔄 [Middleware] Accès mes-factures refusé (rôle: ${user.role})`)
        return NextResponse.redirect(new URL('/tableau-de-bord', request.url))
      }
    }
  }

  // LOGIQUE PRINCIPALE : Si connecté mais profil incomplet
  if (session && !session.user.hasProfile && !isAllowedIncompleteProfilePath && !isPublicPath) {
    console.log(`🔄 [Middleware] Redirection vers onboarding - Profil incomplet pour ${session.user.email}`)
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  console.log(`🔄 [Middleware] Accès autorisé à ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}