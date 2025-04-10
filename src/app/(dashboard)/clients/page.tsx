// src/app/(dashboard)/clients/page.tsx
import { Metadata } from "next"
import { getServerSession } from "@/lib/auth/session"
import ClientsContainer from "@/components/clients/clients-container"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth.config" // Utilisez auth à la place de getServerSession

export const metadata: Metadata = {
  title: "Gestion des clients | SereniBook",
  description: "Gérez vos clients et suivez leur historique",
}

export default async function ClientsPage() {
  // Utilisez auth() au lieu de getServerSession()
  const session = await auth()
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!session) {
    return redirect("/connexion")
  }
  
  // Vérifier que l'utilisateur est bien un professionnel
  if (session.user.role !== "PROFESSIONAL") {
    return redirect("/tableau-de-bord")
  }

  return (
    <div className="container mx-auto py-8">
      <ClientsContainer />
    </div>
  )
}