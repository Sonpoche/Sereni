"use client"

import { useState } from "react"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { User, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import  Stepper  from "./stepper"
import AccountForm from "./steps/account-form"
import PersonalInfoForm from "./steps/personal-info"
import ActivityForm from "./steps/activity-form"
import BioForm from "./steps/bio-form"
import PreferencesForm from "./steps/preferences-form"
import type { PreferencesFormData } from "./steps/preferences-form"

interface FormData {
  account?: {
    email: string;
    password: string;
  };
  personalInfo?: {
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  activity?: {
    type: string;
    otherTypeDetails?: string;
    experience: number;
  };
  bio?: {
    bio: string;
    approach: string;
  };
  preferences?: PreferencesFormData;
  userId?: string;
}

interface AccountFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterContainerProps {
  initialStep?: number;
  initialRole?: UserRole;
}

export default function RegisterContainer({ 
  initialStep = 1,
  initialRole
}: RegisterContainerProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole || null)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, loginWithCredentials } = useAuth()

  const handleAccountSubmit = async (data: AccountFormData) => {
    if (!selectedRole) return;
    
    setIsLoading(true)
    try {
      // Création du compte
      const result = await register({
        email: data.email,
        password: data.password,
        name: "",
        role: selectedRole
      })

      // Login automatique après inscription
      const loginResult = await loginWithCredentials(data.email, data.password)

      if (loginResult?.ok) {
        toast.success("Inscription réussie !")
        router.push("/tableau-de-bord")
      }
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue lors de la création du compte")
    } finally {
      setIsLoading(false)
    }
  }

  // Si aucun rôle n'est sélectionné, afficher la sélection du type de compte
  if (!selectedRole) {
    return (
      <div className="w-full max-w-[480px] mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-medium text-gray-900">
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
            className="p-6 bg-white rounded-lg border border-gray-100 hover:border-primary/20 transition-all text-center group"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
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
            className="p-6 bg-white rounded-lg border border-gray-100 hover:border-primary/20 transition-all text-center group"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-lg font-medium mb-2">Je suis un professionnel</h2>
            <p className="text-gray-500 text-sm">
              Je propose des séances de coaching, yoga, thérapie ou autre activité bien-être
            </p>
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-500">Déjà inscrit ? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Formulaire de création de compte initial
  return (
    <div className="w-full max-w-[480px] mx-auto">
      <button
        onClick={() => setSelectedRole(null)}
        className="mb-8 flex items-center text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au choix du profil
      </button>

      <AccountForm 
        onSubmit={handleAccountSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}