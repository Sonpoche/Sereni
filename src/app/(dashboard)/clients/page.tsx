// src/app/(dashboard)/clients/page.tsx
import { Metadata } from "next"
import { getServerSession } from "@/lib/auth/session"
import ClientsContainer from "@/components/clients/clients-container"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Gestion des clients | SereniBook",
  description: "Gérez vos clients et suivez leur historique",
}

export default async function ClientsPage() {
  const session = await getServerSession()
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!session) {
    redirect("/connexion")
  }
  
  // Vérifier que l'utilisateur est bien un professionnel
  if (session.role !== "PROFESSIONAL") {
    redirect("/tableau-de-bord")
  }

  return (
    <div className="container mx-auto py-8">
      <ClientsContainer />
    </div>
  )
}