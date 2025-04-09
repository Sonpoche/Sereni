// src/app/(dashboard)/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Détection du mode mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
      
      // Fermer automatiquement la sidebar sur petit écran
      if (isMobileView) {
        setIsSidebarOpen(false)
      } else if (pathname === "/rendez-vous") {
        // Fermer par défaut sur la page rendez-vous pour plus d'espace
        setIsSidebarOpen(false)
      } else {
        // Ouvrir par défaut sur les autres pages en mode desktop
        setIsSidebarOpen(true)
      }
    }

    // Vérifier au chargement
    checkIfMobile()

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    // Nettoyage
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [pathname])

  // État de chargement
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Redirection si non authentifié
  if (status === "unauthenticated" || !session) {
    router.push("/connexion")
    return null
  }

  // Si l'utilisateur est authentifié
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar avec bouton pour ouvrir/fermer la sidebar */}
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex relative">
        {/* Sidebar avec navigation du dashboard */}
        <DashboardSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={{
            role: session.user.role,
            name: session.user.name
          }}
        />
        
        {/* Bouton pour basculer la sidebar - redesigné et repositionné */}
        <button
          className={cn(
            "fixed z-50 flex items-center justify-center rounded-md shadow-md border border-gray-200 w-6 h-24 transition-all duration-300",
            isSidebarOpen 
              ? "left-64 -ml-3 top-1/2 -translate-y-1/2 hover:bg-primary/10 bg-white" 
              : "left-0 ml-0 top-1/2 -translate-y-1/2 hover:bg-primary/10 bg-lavender-light text-primary rounded-l-none border-l-0"
          )}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Contenu principal - avec padding à gauche quand sidebar est fermée */}
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isSidebarOpen ? 'lg:pl-64' : 'pl-10'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}