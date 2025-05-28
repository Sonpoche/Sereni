// src/app/(public)/cours-collectifs/[id]/page.tsx
import { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma/client"
import { auth } from "@/lib/auth/auth.config"
import CourseDetailsClient from "@/components/group-classes/course-details-client"

interface CoursePageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const groupClass = await prisma.groupClass.findUnique({
    where: { id: params.id },
    include: {
      professional: {
        include: {
          user: { select: { name: true } }
        }
      }
    }
  })

  if (!groupClass) {
    return {
      title: "Cours non trouvé | SereniBook"
    }
  }

  return {
    title: `${groupClass.name} avec ${groupClass.professional.user.name} | SereniBook`,
    description: groupClass.description || `Cours de ${groupClass.category} avec ${groupClass.professional.user.name}`,
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await auth()
  
  const groupClass = await prisma.groupClass.findUnique({
    where: { 
      id: params.id,
      active: true 
    },
    include: {
      professional: {
        include: {
          user: { 
            select: { 
              name: true, 
              email: true 
            } 
          }
        }
      },
      sessions: {
        where: {
          startTime: { gte: new Date() },
          status: "SCHEDULED"
        },
        orderBy: { startTime: 'asc' },
        include: {
          registrations: {
            include: {
              client: {
                include: {
                  user: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!groupClass) {
    notFound()
  }

  // Convertir les objets Decimal en nombres pour la sérialisation
  const serializedGroupClass = {
    ...groupClass,
    price: Number(groupClass.price), // Conversion Decimal -> Number
    createdAt: groupClass.createdAt.toISOString(), // Conversion Date -> String
    updatedAt: groupClass.updatedAt.toISOString(), // Conversion Date -> String
    sessions: groupClass.sessions.map(session => ({
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      registrations: session.registrations.map(reg => ({
        ...reg,
        registeredAt: reg.registeredAt.toISOString()
      }))
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CourseDetailsClient 
        groupClass={serializedGroupClass}
        currentUser={session?.user}
      />
    </div>
  )
}