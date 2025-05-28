// src/app/(public)/cours-collectifs/page.tsx
import { Metadata } from "next"
import { auth } from "@/lib/auth/auth.config"
import AllCoursesClient from "@/components/group-classes/all-courses-client"

export const metadata: Metadata = {
  title: "Cours collectifs | SereniBook",
  description: "Découvrez tous les cours collectifs de bien-être près de chez vous",
}

export default async function CoursCollectifsPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <AllCoursesClient currentUser={session?.user} />
    </div>
  )
}