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
  "/tarifs"
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
  "/api/"
]

export async function middleware(request: NextRequest) {
  // Vérifier si le chemin actuel est public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Vérifier si le chemin actuel est protégé
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Vérifier si c'est un chemin autorisé pour profil incomplet
  const isAllowedIncompleteProfilePath = allowedIncompleteProfilePaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Obtenir la session
  const session = await auth()

  // Protection spéciale pour la page de complétion de profil
  if (request.nextUrl.pathname === "/profil/completer") {
    if (!session) {
      return NextResponse.redirect(new URL("/connexion", request.url))
    }

    // Si le profil est déjà complété, rediriger vers le tableau de bord
    if (session.user.hasProfile) {
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url))
    }

    return NextResponse.next()
  }

  // Si l'utilisateur est sur une page publique et est connecté
  if (session && (request.nextUrl.pathname === "/connexion" || request.nextUrl.pathname === "/inscription")) {
    // Si profil incomplet, rediriger vers profil/completer
    if (!session.user.hasProfile) {
      return NextResponse.redirect(new URL("/profil/completer", request.url))
    }
    // Sinon rediriger vers tableau de bord
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url))
  }

  // Si l'utilisateur est sur une page protégée et n'est pas connecté
  if (!session && isProtectedPath) {
    let callbackUrl = request.nextUrl.pathname
    if (request.nextUrl.search) {
      callbackUrl += request.nextUrl.search
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    return NextResponse.redirect(
      new URL(`/connexion?callbackUrl=${encodedCallbackUrl}`, request.url)
    )
  }

  // NOUVELLE LOGIQUE : Si connecté mais profil incomplet
  if (session && !session.user.hasProfile && !isAllowedIncompleteProfilePath && !isPublicPath) {
    console.log(`🔄 [Middleware] Redirection vers profil/completer - Profil incomplet pour ${session.user.email}`)
    return NextResponse.redirect(new URL("/profil/completer", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}