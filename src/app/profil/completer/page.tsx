// src/app/profil/completer/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock } from "lucide-react"
import { toast } from "sonner"
import PersonalInfoForm from "@/components/register/steps/personal-info"
import ActivityForm from "@/components/register/steps/activity-form"
import BioForm from "@/components/register/steps/bio-form"
import ServicesSetup from "@/components/register/steps/services-setup"
import ScheduleForm from "@/components/register/steps/schedule-form"
import PreferencesForm from "@/components/register/steps/preferences-form"
import CompletionStepper from "@/components/profile/completion-stepper"
import { UserRole } from "@prisma/client"

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
  schedule?: {
    workingDays: number[];
    startTime: string;
    endTime: string;
    isFullWeek: boolean;
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

// Clés pour le localStorage
const STORAGE_KEYS = {
  COMPLETION_FORM_DATA: 'serenibook_completion_data',
  COMPLETION_CURRENT_STEP: 'serenibook_completion_step',
}

export default function CompleteProfilePage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasRestoredData, setHasRestoredData] = useState(false)

  // Fonction pour sauvegarder les données temporairement
  const saveDataToStorage = (data: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETION_FORM_DATA, JSON.stringify(data))
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }
  }

  // Fonction pour récupérer les données sauvegardées
  const getSavedData = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.COMPLETION_FORM_DATA)
        return saved ? JSON.parse(saved) : {}
      } catch (error) {
        console.error('Erreur lors de la récupération:', error)
        return {}
      }
    }
    return {}
  }

  // Fonction pour nettoyer les données sauvegardées
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.COMPLETION_FORM_DATA)
        localStorage.removeItem(STORAGE_KEYS.COMPLETION_CURRENT_STEP)
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error)
      }
    }
  }

  // Restaurer les données depuis le localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      try {
        // Restaurer les données du formulaire
        const savedFormData = getSavedData()
        if (Object.keys(savedFormData).length > 0) {
          setFormData(savedFormData)
          
          // Afficher un message de restauration
          toast.success("Vos données ont été restaurées !", {
            description: "Vous pouvez continuer là où vous vous étiez arrêté.",
            duration: 4000
          })
        }

        // Restaurer l'étape courante
        const savedStep = localStorage.getItem(STORAGE_KEYS.COMPLETION_CURRENT_STEP)
        if (savedStep && parseInt(savedStep) > 1) {
          setCurrentStep(parseInt(savedStep))
        }

        setHasRestoredData(true)
      } catch (error) {
        console.error('Erreur lors de la restauration des données:', error)
        clearSavedData()
      }
    }
  }, [session?.user?.id])

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (hasRestoredData && typeof window !== 'undefined') {
      try {
        if (Object.keys(formData).length > 0) {
          saveDataToStorage(formData)
        }
        localStorage.setItem(STORAGE_KEYS.COMPLETION_CURRENT_STEP, currentStep.toString())
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }
  }, [formData, currentStep, hasRestoredData])

  // Calcul du temps estimé restant
  const getEstimatedTime = () => {
    if (session?.user?.role === UserRole.CLIENT) {
      const times = [2, 0.5] // en minutes
      return times.slice(currentStep - 1).reduce((a, b) => a + b, 0)
    } else {
      const times = [2, 2, 3, 4, 2, 1] // en minutes  
      return times.slice(currentStep - 1).reduce((a, b) => a + b, 0)
    }
  }

  // Données de l'étape actuelle pour l'affichage
  const getCurrentStepData = () => {
    if (session?.user?.role === UserRole.CLIENT) {
      const clientSteps = [
        { title: "Informations personnelles", description: "Renseignez vos coordonnées" },
        { title: "Préférences", description: "Configurez votre compte" }
      ]
      return clientSteps[currentStep - 1]
    } else {
      const professionalSteps = [
        { title: "Informations personnelles", description: "Renseignez vos coordonnées" },
        { title: "Votre activité", description: "Décrivez votre métier" },
        { title: "Votre présentation", description: "Parlez de votre approche" },
        { title: "Vos services", description: "Définissez vos prestations" },
        { title: "Vos horaires", description: "Définissez vos disponibilités" },
        { title: "Préférences", description: "Configurez votre compte" }
      ]
      return professionalSteps[currentStep - 1]
    }
  }

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
    router.push("/connexion")
    return null
  }

  const handlePersonalInfoSubmit = async (data: FormData["personalInfo"]) => {
    console.log("Personal Info Data:", data);
    const newFormData = {
      ...formData,
      personalInfo: data
    }
    setFormData(newFormData)
    setCurrentStep(prev => prev + 1)
  }

  const handleActivitySubmit = async (data: FormData["activity"]) => {
    console.log("Activity Data:", data);
    const newFormData = {
      ...formData,
      activity: data
    }
    setFormData(newFormData)
    setCurrentStep(prev => prev + 1)
  }

  const handleBioSubmit = async (data: FormData["bio"]) => {
    console.log("Bio Data:", data);
    const newFormData = {
      ...formData,
      bio: data
    }
    setFormData(newFormData)
    setCurrentStep(prev => prev + 1)
  }

  const handleServicesSubmit = async (data: FormData["services"]) => {
    console.log("Services Data:", data);
    const newFormData = {
      ...formData,
      services: data
    }
    setFormData(newFormData)
    setCurrentStep(prev => prev + 1)
  }

  const handleScheduleSubmit = async (data: FormData["schedule"]) => {
    console.log("Schedule Data:", data);
    const newFormData = {
      ...formData,
      schedule: data
    }
    setFormData(newFormData)
    setCurrentStep(prev => prev + 1)
  }

  const handlePreferencesSubmit = async (data: FormData["preferences"]) => {
    console.log("Final Form Data:", {
      ...formData,
      preferences: data
    });

    setIsLoading(true)
    try {
      // Préparer les données pour l'API
      const onboardingData = {
        userId: session.user.id,
        role: session.user.role,
        personalInfo: formData.personalInfo,
        activity: formData.activity,
        bio: formData.bio,
        services: formData.services,
        schedule: formData.schedule,
        preferences: data
      }

      console.log("Sending onboarding data:", onboardingData)

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la sauvegarde du profil")
      }

      const result = await response.json()
      
      if (result.success) {
        clearSavedData() // Nettoyer les données après succès
        toast.success("Profil complété avec succès !")
        
        // ✅ NOUVEAU: Vérifier si c'est un professionnel avec un plan sélectionné
        const selectedPlan = localStorage.getItem('serenibook_selected_plan')
        const isSubscriptionFlow = localStorage.getItem('serenibook_subscription_flow')
        
        if (session.user.role === 'PROFESSIONAL' && selectedPlan && isSubscriptionFlow) {
          // Rediriger vers la finalisation de l'abonnement
          router.push('/finaliser-abonnement')
        } else {
          // Forcer la mise à jour de la session et rediriger
          try {
            await fetch("/api/auth/session", {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache"
              }
            })
            
            setTimeout(() => {
              window.location.href = "/tableau-de-bord"
            }, 1000)
          } catch (error) {
            window.location.href = "/tableau-de-bord"
          }
        }
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

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const currentStepData = getCurrentStepData()

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header minimaliste */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-12">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900"
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              {/* Indicateur de temps minimaliste */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Environ {Math.ceil(getEstimatedTime())} min restantes</span>
              </div>
            </div>

            {/* Titre contextuel */}
            <div className="text-center mb-16">
              <div className="text-sm text-gray-500 mb-2">
                Finalisez votre inscription
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {currentStepData?.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {session.user.role === UserRole.CLIENT 
                  ? "Configurons votre compte pour une expérience optimale"
                  : "Créons ensemble votre profil professionnel attractif"
                }
              </p>
            </div>

            {/* Stepper avec icônes */}
            <CompletionStepper 
              userType={session.user.role}
              currentStep={currentStep}
            />
          </div>

          {/* Contenu principal - largeur identique à l'onboarding */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-16 max-w-4xl mx-auto">
            {currentStep === 1 && (
              <PersonalInfoForm
                userType={session.user.role}
                onSubmit={handlePersonalInfoSubmit}
                onBack={handleBack}
                isLoading={isLoading}
                initialData={formData.personalInfo}
              />
            )}

            {currentStep === 2 && session.user.role === UserRole.PROFESSIONAL && (
              <ActivityForm
                onSubmit={handleActivitySubmit}
                onBack={handleBack}
                isLoading={isLoading}
                initialData={formData.activity}
              />
            )}

            {currentStep === 3 && session.user.role === UserRole.PROFESSIONAL && (
              <BioForm
                onSubmit={handleBioSubmit}
                onBack={handleBack}
                isLoading={isLoading}
                initialData={formData.bio}
              />
            )}

            {currentStep === 4 && session.user.role === UserRole.PROFESSIONAL && (
              <ServicesSetup
                professionalType={formData.activity?.type}
                onSubmit={handleServicesSubmit}
                onBack={handleBack}
                isLoading={isLoading}
                initialData={formData.services}
              />
            )}

            {currentStep === 5 && session.user.role === UserRole.PROFESSIONAL && (
              <ScheduleForm
                onSubmit={handleScheduleSubmit}
                onBack={handleBack}
                isLoading={isLoading}
                initialData={formData.schedule}
              />
            )}

            {/* Étape Préférences - position adaptée selon le rôle */}
            {((currentStep === 2 && session.user.role === UserRole.CLIENT) ||
              (currentStep === 6 && session.user.role === UserRole.PROFESSIONAL)) && (
              <PreferencesForm
                userType={session.user.role}
                onSubmit={handlePreferencesSubmit}
                onBack={handleBack}
                isLoading={isLoading}
                initialData={formData.preferences}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}