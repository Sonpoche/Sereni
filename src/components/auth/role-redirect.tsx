// src/components/auth/role-redirect.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleRedirectProps {
  children?: React.ReactNode
}

function getPostLoginRedirect(userRole: string): string {
  switch (userRole) {
    case 'ADMIN':
      return '/admin'
    case 'PROFESSIONAL':
    case 'CLIENT':
    default:
      return '/tableau-de-bord'
  }
}

export function RoleRedirect({ children }: RoleRedirectProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const currentPath = window.location.pathname
      
      console.log(`🔄 [RoleRedirect] Utilisateur connecté: ${session.user.role} sur ${currentPath}`)
      
      // Si l'admin est sur /tableau-de-bord, le rediriger vers /admin
      if (session.user.role === 'ADMIN' && currentPath === '/tableau-de-bord') {
        console.log('🔄 [RoleRedirect] Admin redirigé vers /admin')
        router.replace('/admin')
        return
      }

      // Si un utilisateur normal essaie d'accéder à /admin
      if (session.user.role !== 'ADMIN' && currentPath.startsWith('/admin')) {
        console.log('🔄 [RoleRedirect] Non-admin redirigé vers tableau-de-bord')
        router.replace('/tableau-de-bord')
        return
      }

      // Redirection depuis les pages publiques après connexion
      if (currentPath === '/connexion' || currentPath === '/login') {
        const redirectTo = getPostLoginRedirect(session.user.role)
        console.log(`🔄 [RoleRedirect] Redirection post-connexion vers ${redirectTo}`)
        router.replace(redirectTo)
        return
      }
    }
  }, [session, status, router])

  return <>{children}</>
}

// Hook pour redirection manuelle
export function useRoleRedirect() {
  const { data: session } = useSession()
  const router = useRouter()

  const redirectToRoleDashboard = () => {
    if (session?.user) {
      const redirectTo = getPostLoginRedirect(session.user.role)
      console.log(`🔄 [useRoleRedirect] Redirection vers ${redirectTo}`)
      router.push(redirectTo)
    }
  }

  return { redirectToRoleDashboard }
}