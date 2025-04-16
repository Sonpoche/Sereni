// src/app/(dashboard)/services/page.tsx
import { auth } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { Metadata } from "next"
import ServicesManager from "@/components/services/services-manager"
import prisma from "@/lib/prisma/client"
import { PageHeader } from "@/components/ui/page-header"

export const metadata: Metadata = {
  title: "Mes services | SereniBook",
  description: "Gérez vos services et prestations",
}

export default async function ServicesPage() {
  const session = await auth()
  
  if (!session) {
    return redirect("/connexion")
  }
  
  if (session.user.role !== "PROFESSIONAL") {
    return redirect("/tableau-de-bord")
  }
  
  // Récupérer les infos du profil pour les passer au composant
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      professionalProfile: {
        select: {
          id: true,
        }
      }
    }
  })
  
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Mes services"
        description="Gérez les services que vous proposez à vos clients"
      />
      
      <div className="mt-8">
        <ServicesManager profileData={profile || {}} />
      </div>
    </div>
  )
}