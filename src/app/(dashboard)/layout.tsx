// src/app/(dashboard)/layout.tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    router.push("/login")
    return null
  }

  // Si l'utilisateur est authentifié
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar avec bouton pour ouvrir/fermer la sidebar */}
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex">
        {/* Sidebar avec navigation du dashboard */}
        <DashboardSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={{
            role: session.user.role,
            name: session.user.name
          }}
        />

        {/* Contenu principal */}
        <main className="flex-1 p-6 lg:pl-64">
          {children}
        </main>
      </div>
    </div>
  )
}