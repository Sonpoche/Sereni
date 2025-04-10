// src/app/(dashboard)/rendez-vous/nouveau/page.tsx
import { Metadata } from "next"
import { auth } from "@/lib/auth/auth.config" 
import { redirect } from "next/navigation"
import NewAppointmentPage from "@/components/appointments/new-appointment-page"

export const metadata: Metadata = {
  title: "Nouveau rendez-vous | SereniBook",
  description: "Créer un nouveau rendez-vous",
}

export default async function NewAppointmentRoute({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const session = await auth()
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!session) {
    return redirect("/connexion")
  }
  
  // Vérifier que l'utilisateur est bien un professionnel
  if (session.user.role !== "PROFESSIONAL") {
    return redirect("/tableau-de-bord")
  }

  // Récupérer l'ID client des paramètres d'URL si présent
  const clientId = searchParams.clientId

  return (
    <div className="container mx-auto py-8">
      <NewAppointmentPage 
        professionalId={session.user.id} 
        preselectedClientId={clientId}
      />
    </div>
  )
}