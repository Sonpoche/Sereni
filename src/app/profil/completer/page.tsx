"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PersonalInfoForm from "@/components/register/steps/personal-info"
import ActivityForm from "@/components/register/steps/activity-form"
import BioForm from "@/components/register/steps/bio-form"
import PreferencesForm from "@/components/register/steps/preferences-form"
import Stepper from "@/components/register/stepper"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"

interface FormData {
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
  preferences?: {
    notifications: {
      email: {
        bookingConfirmation: boolean;
        bookingReminder: boolean;
        bookingCancellation: boolean;
        newsletter: boolean;
        promotions: boolean;
      };
      sms: {
        bookingConfirmation: boolean;
        bookingReminder: boolean;
        bookingCancellation: boolean;
      };
    };
    privacy: {
      showProfile: boolean;
      showAvailability: boolean;
    };
  };
}

export default function CompleteProfilePage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)

  // Vérification du chargement de la session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Vérification de la session et de l'ID utilisateur
  if (!session?.user?.id) {
    console.error("ID utilisateur non trouvé dans la session")
    router.push("/login")
    return null
  }

  const handlePersonalInfoSubmit = async (data: FormData["personalInfo"]) => {
    console.log("Personal Info Data:", data);
    setFormData((prev: FormData) => ({
      ...prev,
      personalInfo: data
    }))
    setCurrentStep(prev => prev + 1)
  }

  const handleActivitySubmit = async (data: FormData["activity"]) => {
    console.log("Activity Data:", data);
    setFormData((prev: FormData) => ({
      ...prev,
      activity: data
    }))
    setCurrentStep(prev => prev + 1)
  }

  const handleBioSubmit = async (data: FormData["bio"]) => {
    console.log("Bio Data:", data);
    setFormData((prev: FormData) => ({
      ...prev,
      bio: data
    }))
    setCurrentStep(prev => prev + 1)
  }

  const handlePreferencesSubmit = async (data: FormData["preferences"]) => {
    console.log("Final Form Data:", {
      ...formData,
      preferences: data
    });

    setIsLoading(true)
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id, // On s'assure d'inclure l'ID utilisateur
          role: session.user.role,
          ...formData,
          preferences: data
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la sauvegarde du profil")
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success("Profil complété avec succès !")
        router.push(result.redirect || "/tableau-de-bord")
      } else {
        throw new Error(result.error || "Erreur lors de la création du profil")
      }
    } catch (error) {
      console.error("Erreur lors de la finalisation du profil:", error)
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/tableau-de-bord">
            <Button variant="ghost" className="mb-6">
              ← Retour au tableau de bord
            </Button>
          </Link>

          <Stepper 
            userType={session.user.role}
            currentStep={currentStep}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-8 mt-8">
            {currentStep === 1 && (
              <PersonalInfoForm
                userType={session.user.role}
                onSubmit={handlePersonalInfoSubmit}
                onBack={() => router.push("/tableau-de-bord")}
                isLoading={isLoading}
              />
            )}

            {currentStep === 2 && session.user.role === UserRole.PROFESSIONAL && (
              <ActivityForm
                onSubmit={handleActivitySubmit}
                onBack={() => setCurrentStep(prev => prev - 1)}
                isLoading={isLoading}
              />
            )}

            {currentStep === 3 && session.user.role === UserRole.PROFESSIONAL && (
              <BioForm
                onSubmit={handleBioSubmit}
                onBack={() => setCurrentStep(prev => prev - 1)}
                isLoading={isLoading}
              />
            )}

            {((currentStep === 2 && session.user.role === UserRole.CLIENT) ||
              (currentStep === 4 && session.user.role === UserRole.PROFESSIONAL)) && (
              <PreferencesForm
                userType={session.user.role}
                onSubmit={handlePreferencesSubmit}
                onBack={() => setCurrentStep(prev => prev - 1)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}