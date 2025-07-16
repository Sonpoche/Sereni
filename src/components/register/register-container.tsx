// src/components/register/register-container.tsx
"use client"

import { useState } from "react"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { User, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import Stepper from "./stepper"
import AccountForm from "./steps/account-form"
import PersonalInfoForm from "./steps/personal-info"
import ActivityForm from "./steps/activity-form"
import BioForm from "./steps/bio-form"
import PreferencesForm from "./steps/preferences-form"
import ServicesSetup from "./steps/services-setup"
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
  services?: {
    services: Array<{
      name: string;
      description: string;
      duration: number;
      price: number;
      color: string;
      location?: string;
    }>;
  };
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
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, completeOnboarding } = useAuth()

  // Définition des étapes selon le rôle
  const getSteps = () => {
    if (selectedRole === UserRole.CLIENT) {
      return [
        { id: 1, title: "Compte", component: "account" },
        { id: 2, title: "Informations personnelles", component: "personal" },
        { id: 3, title: "Finalisation", component: "completion" }
      ]
    } else {
      return [
        { id: 1, title: "Compte", component: "account" },
        { id: 2, title: "Informations personnelles", component: "personal" },
        { id: 3, title: "Activité", component: "activity" },
        { id: 4, title: "Présentation", component: "bio" },
        { id: 5, title: "Services", component: "services" },
        { id: 6, title: "Préférences", component: "preferences" }
      ]
    }
  }

  const steps = getSteps()

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

      // Stocker les données du compte
      setFormData(prev => ({
        ...prev,
        account: {
          email: data.email,
          password: data.password
        },
        userId: result.user.id
      }))

      // Pour les clients, rediriger directement vers le tableau de bord
      if (selectedRole === UserRole.CLIENT) {
        toast.success("Inscription réussie !")
        router.push("/tableau-de-bord")
      } else {
        // Pour les professionnels, passer à l'étape suivante
        setCurrentStep(2)
        toast.success("Compte créé avec succès !")
      }
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue lors de la création du compte")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePersonalInfoSubmit = async (data: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: data
    }))
    setCurrentStep(3)
  }

  const handleActivitySubmit = async (data: any) => {
    setFormData(prev => ({
      ...prev,
      activity: data
    }))
    setCurrentStep(4)
  }

  const handleBioSubmit = async (data: any) => {
    setFormData(prev => ({
      ...prev,
      bio: data
    }))
    setCurrentStep(5) // Passer à l'étape Services
  }

  const handleServicesSubmit = async (data: any) => {
    setFormData(prev => ({
      ...prev,
      services: data
    }))
    setCurrentStep(6) // Passer aux préférences
  }

  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true)
    
    try {
      // Compilation finale des données
      const finalData = {
        ...formData,
        preferences: data
      }

      // Appel à l'API d'onboarding
      const onboardingData = {
        userId: finalData.userId!,
        role: selectedRole!,
        personalInfo: finalData.personalInfo || {}, // Assurer que ce n'est jamais undefined
        activity: finalData.activity,
        bio: finalData.bio,
        services: finalData.services,
        preferences: finalData.preferences
      }

      console.log("Données d'onboarding complètes:", onboardingData)

      const result = await completeOnboarding(onboardingData)
      
      if (result.success) {
        toast.success("Profil créé avec succès !")
        router.push("/tableau-de-bord")
      }
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue lors de la finalisation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AccountForm 
            onSubmit={handleAccountSubmit}
            isLoading={isLoading}
          />
        )
      case 2:
        return (
          <PersonalInfoForm 
            userType={selectedRole!}
            onSubmit={handlePersonalInfoSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      case 3:
        return (
          <ActivityForm 
            onSubmit={handleActivitySubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      case 4:
        return (
          <BioForm 
            onSubmit={handleBioSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      case 5:
        return (
          <ServicesSetup 
            onSubmit={handleServicesSubmit}
            onBack={handleBack}
            professionalType={formData.activity?.type || "default"}
            isLoading={isLoading}
          />
        )
      case 6:
        return (
          <PreferencesForm 
            userType={selectedRole!}
            onSubmit={handlePreferencesSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )
      default:
        return null
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
          <Link href="/connexion" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Formulaire avec étapes pour les professionnels
  if (selectedRole === UserRole.PROFESSIONAL && currentStep > 1) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedRole(null)}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au choix du profil
          </button>

          <Stepper 
            userType={selectedRole!}
            currentStep={currentStep}
          />
        </div>

        {/* Contenu de l'étape */}
        {renderStep()}
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

      {renderStep()}
    </div>
  )
}