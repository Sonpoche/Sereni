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
  "/finaliser-abonnement", // ✅ AJOUT: Autoriser l'accès à la page de checkout
  "/inscription-reussie"    // ✅ AJOUT: Autoriser l'accès à la page de confirmation
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
  "/parametres"
]

// Pages qui ne nécessitent pas un profil complet (en plus des publicPaths)
const allowedIncompleteProfilePaths = [
  "/profil/completer",
  "/api/",
  "/finaliser-abonnement", // ✅ AJOUT: Permettre l'accès même avec profil complet
  "/inscription-reussie"   // ✅ AJOUT: Permettre l'accès même avec profil complet
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // AJOUT DE LOGS pour debug
  console.log(`🔄 [Middleware] Chemin: ${pathname}`)

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

  // AJOUT DE LOGS pour debug
  if (session) {
    console.log(`🔄 [Middleware] Utilisateur: ${session.user.email}, hasProfile: ${session.user.hasProfile}`)
  }

  // Protection spéciale pour la page de complétion de profil
  if (pathname === "/profil/completer") {
    if (!session) {
      console.log(`🔄 [Middleware] Redirection vers connexion - non connecté`)
      return NextResponse.redirect(new URL("/connexion", request.url))
    }

    // Si le profil est déjà complété, rediriger vers le tableau de bord
    if (session.user.hasProfile) {
      console.log(`🔄 [Middleware] Redirection vers tableau-de-bord - profil complet`)
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url))
    }

    console.log(`🔄 [Middleware] Accès autorisé à profil/completer`)
    return NextResponse.next()
  }

  // ✅ NOUVELLE LOGIQUE: Protection spéciale pour le flow d'abonnement
  if (pathname === "/finaliser-abonnement" || pathname === "/inscription-reussie") {
    if (!session) {
      console.log(`🔄 [Middleware] Redirection vers connexion - flow abonnement non connecté`)
      return NextResponse.redirect(new URL("/connexion", request.url))
    }

    // Vérifier que c'est un professionnel
    if (session.user.role !== "PROFESSIONAL") {
      console.log(`🔄 [Middleware] Redirection vers tableau-de-bord - flow abonnement client`)
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url))
    }

    console.log(`🔄 [Middleware] Accès autorisé au flow d'abonnement: ${pathname}`)
    return NextResponse.next()
  }

  // Si l'utilisateur est sur une page publique et est connecté
  if (session && (pathname === "/connexion" || pathname === "/inscription")) {
    // Si profil incomplet, rediriger vers profil/completer
    if (!session.user.hasProfile) {
      console.log(`🔄 [Middleware] Redirection vers profil/completer - depuis page publique`)
      return NextResponse.redirect(new URL("/profil/completer", request.url))
    }
    
    // ✅ CORRECTION: Vérifier d'abord si on est dans un flow d'abonnement
    // On peut être sur /inscription mais venir de Stripe avec un flow d'abonnement
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

  // LOGIQUE PRINCIPALE : Si connecté mais profil incomplet
  if (session && !session.user.hasProfile && !isAllowedIncompleteProfilePath && !isPublicPath) {
    console.log(`🔄 [Middleware] Redirection vers profil/completer - Profil incomplet pour ${session.user.email}`)
    return NextResponse.redirect(new URL("/profil/completer", request.url))
  }

  console.log(`🔄 [Middleware] Accès autorisé à ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}