// src/app/(dashboard)/cours-collectifs/layout.tsx
import { auth } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cours collectifs | SereniBook",
  description: "Gérez vos cours collectifs et leurs participants",
}

export default async function CoursCollectifsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    return redirect("/connexion")
  }
  
  if (session.user.role !== "PROFESSIONAL") {
    return redirect("/tableau-de-bord")
  }
  
  return <>{children}</>
}