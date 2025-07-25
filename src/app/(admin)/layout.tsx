// src/app/(admin)/layout.tsx
import { auth } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"

export const metadata = {
  title: "Admin - SereniBook",
  description: "Interface d'administration SereniBook"
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Vérifier que l'utilisateur est connecté et est admin
  if (!session?.user) {
    redirect("/connexion")
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation principale admin */}
      <AdminNavbar user={session.user} />
      
      <div className="flex">
        {/* Sidebar admin */}
        <AdminSidebar />
        
        {/* Contenu principal */}
        <main className="flex-1 ml-64 p-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  )
}