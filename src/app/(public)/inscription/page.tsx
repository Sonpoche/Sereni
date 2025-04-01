// src/app/(public)/register/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/onboarding?role=${selectedRole}&flow=email`)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-medium text-gray-900">
            Créer votre compte SereniBook
          </h1>
          <p className="text-gray-500 text-base">
            Choisissez votre profil pour commencer
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Card Client */}
          <button
            onClick={() => setSelectedRole(UserRole.CLIENT)}
            className={cn(
              "p-6 bg-white rounded-lg border text-center group transition-all",
              selectedRole === UserRole.CLIENT 
                ? "border-primary shadow-sm" 
                : "border-gray-100 hover:border-primary/20"
            )}
          >
            <div className="flex justify-center mb-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                selectedRole === UserRole.CLIENT 
                  ? "bg-primary/20" 
                  : "bg-primary/10 group-hover:bg-primary/15"
              )}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-medium mb-2">Je recherche un coach</h2>
            <p className="text-gray-500 text-sm">
              Je souhaite réserver des séances avec des professionnels du bien-être
            </p>
          </button>

          {/* Card Professionnel */}
          <button
            onClick={() => setSelectedRole(UserRole.PROFESSIONAL)}
            className={cn(
              "p-6 bg-white rounded-lg border text-center group transition-all",
              selectedRole === UserRole.PROFESSIONAL 
                ? "border-primary shadow-sm" 
                : "border-gray-100 hover:border-primary/20"
            )}
          >
            <div className="flex justify-center mb-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                selectedRole === UserRole.PROFESSIONAL 
                  ? "bg-primary/20" 
                  : "bg-primary/10 group-hover:bg-primary/15"
              )}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-medium mb-2">Je suis un professionnel</h2>
            <p className="text-gray-500 text-sm">
              Je propose des séances de coaching, yoga, thérapie ou autre activité bien-être
            </p>
          </button>
        </div>

        {/* Bouton Email */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium transition-colors",
            selectedRole 
              ? "bg-primary text-white hover:bg-primary/90" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          S'inscrire avec mon email
        </button>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        {/* Lien de connexion */}
        <div className="text-center text-sm">
          <span className="text-gray-500">Déjà inscrit ? </span>
          <Link href="/connexion" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  )
}