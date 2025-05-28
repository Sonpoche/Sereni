// src/app/(public)/cours-collectifs/[id]/inscription-reussie/page.tsx
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { auth } from "@/lib/auth/auth.config"
import prisma from "@/lib/prisma/client"
import RegistrationSuccessClient from "@/components/group-classes/registration-success-client"

export const metadata: Metadata = {
  title: "Inscription réussie | SereniBook",
  description: "Votre inscription au cours collectif a été confirmée",
}

interface RegistrationSuccessPageProps {
  params: { id: string }
  searchParams: { session_id?: string }
}

export default async function RegistrationSuccessPage({ 
  params, 
  searchParams 
}: RegistrationSuccessPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/connexion")
  }

  if (!searchParams.session_id) {
    notFound()
  }

  // Récupérer les détails du cours
  const groupClass = await prisma.groupClass.findUnique({
    where: { id: params.id },
    include: {
      professional: {
        include: {
          user: { select: { name: true, email: true } }
        }
      }
    }
  })

  if (!groupClass) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Chargement...</div>}>
        <RegistrationSuccessClient 
          groupClass={groupClass}
          sessionId={searchParams.session_id}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  )
}