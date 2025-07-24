// src/app/profil/completer/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock } from "lucide-react"
import { toast } from "sonner"
import PersonalInfoForm from "@/components/register/steps/personal-info"
import ActivityForm from "@/components/register/steps/activity-form"
import BioForm from "@/components/register/steps/bio-form"
import ServicesSetup from "@/components/register/steps/services-setup"
import ScheduleForm from "@/components/register/steps/schedule-form"
import PreferencesForm from "@/components/register/steps/preferences-form"
import SubscriptionStep from "@/components/register/steps/subscription-step"
import CompletionStepper from "@/components/profile/completion-stepper"
import { UserRole } from "@prisma/client"
import { useAuth } from "@/hooks/use-auth"
import type { PreferencesFormData } from "@/components/register/steps/preferences-form"

interface FormData {
  personalInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    cabinetName?: string;
    siret?: string;
    website?: string;
    latitude?: number;
    longitude?: number;
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
  preferences?: PreferencesFormData;
}

// Clés pour le localStorage
const STORAGE_KEYS = {
  COMPLETION_FORM_DATA: 'serenibook_completion_data',
  COMPLETION_CURRENT_STEP: 'serenibook_completion_step',
  SELECTED_PLAN: 'serenibook_selected_plan'
}

export default function CompleteProfilePage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeOnboarding } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('premium')

  // ✅ Récupérer le plan sélectionné depuis la base de données en priorité
  useEffect(() => {
    const loadSelectedPlan = async () => {
      // 1. Essayer de récupérer depuis les paramètres URL
      const planFromUrl = searchParams.get('plan') as 'standard' | 'premium'
      if (planFromUrl && (planFromUrl === 'standard' || planFromUrl === 'premium')) {
        console.log('🟦 [CompleteProfile] Plan récupéré depuis URL:', planFromUrl)
        setSelectedPlan(planFromUrl)
        // Sauvegarder en localStorage et base si possible
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, planFromUrl)
        }
        if (session?.user?.id) {
          try {
            await fetch('/api/user/update-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ selectedPlan: planFromUrl })
            })
          } catch (error) {
            console.log('🟨 [CompleteProfile] Erreur sauvegarde base (non critique):', error)
          }
        }
        return
      }

      // 2. Si utilisateur connecté, essayer de récupérer depuis la base de données
      if (session?.user?.id) {
        try {
          console.log('🟦 [CompleteProfile] Récupération du plan depuis la base de données...')
          const response = await fetch('/api/user/get-plan')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data.selectedPlan) {
              console.log('🟦 [CompleteProfile] Plan récupéré depuis la base:', data.data.selectedPlan)
              setSelectedPlan(data.data.selectedPlan)
              // Synchroniser avec localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, data.data.selectedPlan)
              }
              return
            }
          }
        } catch (error) {
          console.log('🟨 [CompleteProfile] Erreur récupération plan depuis base:', error)
        }
      }

      // 3. Fallback : récupérer depuis localStorage
      if (typeof window !== 'undefined') {
        const savedPlan = localStorage.getItem(STORAGE_KEYS.SELECTED_PLAN) as 'standard' | 'premium'
        if (savedPlan && (savedPlan === 'standard' || savedPlan === 'premium')) {
          console.log('🟦 [CompleteProfile] Plan récupéré depuis localStorage:', savedPlan)
          setSelectedPlan(savedPlan)
          return
        }
      }

      // 4. Défaut : premium
      console.log('🟦 [CompleteProfile] Aucun plan trouvé, utilisation du défaut: premium')
      setSelectedPlan('premium')
    }

    if (session?.user?.id || typeof window !== 'undefined') {
      loadSelectedPlan()
    }
  }, [searchParams, session?.user?.id])

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
        localStorage.removeItem(STORAGE_KEYS.SELECTED_PLAN)
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
        localStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, selectedPlan)
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }
  }, [formData, currentStep, hasRestoredData, selectedPlan])

  // Calcul du temps estimé restant (ajout étape abonnement pour professionnels)
  const getEstimatedTime = () => {
    if (session?.user?.role === UserRole.CLIENT) {
      const times = [2, 0.5] // en minutes
      return times.slice(currentStep - 1).reduce((a, b) => a + b, 0)
    } else {
      // Ajout de l'étape abonnement (2 min)
      const times = [2, 2, 3, 4, 2, 1, 2] // en minutes (ajout étape 7: abonnement)
      return times.slice(currentStep - 1).reduce((a, b) => a + b, 0)
    }
  }

  // Données de l'étape actuelle pour l'affichage (ajout étape abonnement)
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
        { title: "Préférences", description: "Configurez votre compte" },
        { title: "Abonnement", description: "Choisissez votre plan" }
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

  // Pour les professionnels, on passe maintenant à l'étape abonnement au lieu de finaliser directement
  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    console.log("Preferences Data:", data);
    const newFormData = {
      ...formData,
      preferences: data
    }
    setFormData(newFormData)

    // Pour les clients, on finalise directement
    if (session.user.role === UserRole.CLIENT) {
      await finalizeProfileWithoutPayment(newFormData)
    } else {
      // Pour les professionnels, on passe à l'étape abonnement
      setCurrentStep(prev => prev + 1)
    }
  }

  // Handler pour l'abonnement (même logique que dans register-container.tsx)
  const handleSubscriptionSubmit = async (subscriptionData: { plan: 'standard' | 'premium' }) => {
    // Protection contre les double-clics
    if (isLoading) {
      console.log('🟨 [CompleteProfile] Double-clic détecté, ignoré')
      return
    }
    
    const executionId = Date.now()
    console.log('🟦 [CompleteProfile] 🚀 DÉBUT handleSubscriptionSubmit - ID:', executionId)
    setIsLoading(true)
    
    try {
      console.log('🟦 [CompleteProfile] Plan sélectionné:', subscriptionData.plan)

      // Construction des données d'onboarding COMPLÈTES (même logique que register-container)
      const onboardingData = {
        userId: session.user.id,
        role: session.user.role,
        personalInfo: formData.personalInfo || {}, // S'assurer que c'est un objet vide et non undefined
        activity: formData.activity || {
          type: "AUTRE",
          experience: 0
        },
        bio: formData.bio || {
          bio: "",
          approach: ""
        },
        services: formData.services || { services: [] },
        schedule: formData.schedule || undefined,
        preferences: {
          notifications: {
            email: {
              bookingConfirmation: formData.preferences?.notifications?.email?.bookingConfirmation ?? true,
              bookingReminder: formData.preferences?.notifications?.email?.bookingReminder ?? true,
              bookingCancellation: formData.preferences?.notifications?.email?.bookingCancellation ?? true,
              newsletter: formData.preferences?.notifications?.email?.newsletter ?? false,
              promotions: formData.preferences?.notifications?.email?.promotions ?? false,
            },
            sms: {
              bookingConfirmation: formData.preferences?.notifications?.sms?.bookingConfirmation ?? false,
              bookingReminder: formData.preferences?.notifications?.sms?.bookingReminder ?? false,
              bookingCancellation: formData.preferences?.notifications?.sms?.bookingCancellation ?? false,
            }
          },
          privacy: formData.preferences?.privacy || {
            showProfile: true,
            showAvailability: true
          }
        }
      }

      console.log('🟦 [CompleteProfile] 📤 Complétion onboarding AVANT paiement...')

      // ÉTAPE 1 : Compléter l'onboarding AVANT de créer l'abonnement
      console.log('🟦 [CompleteProfile] 🔄 Appel completeOnboarding... ID:', executionId)
      const result = await completeOnboarding(onboardingData)
      console.log('🟦 [CompleteProfile] 🔄 Retour completeOnboarding ID:', executionId, 'Result:', result)
      
      if (result.success) {
        console.log('🟦 [CompleteProfile] ✅ Onboarding complété avec succès - ID:', executionId)
        
        // Vérifier si le profil existait déjà
        if (result.message && result.message.includes("existe déjà")) {
          console.log('🟨 [CompleteProfile] Profil déjà existant, skip paiement - ID:', executionId)
          clearSavedData()
          toast.success("Profil déjà configuré ! Redirection vers votre tableau de bord.")
          router.push("/tableau-de-bord?welcome=true")
          return
        }
        
        toast.success("Profil créé avec succès !")
        
        // ÉTAPE 2 : Créer la session de checkout Stripe
        console.log('🟦 [CompleteProfile] 💳 Création session checkout Stripe... ID:', executionId)
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: subscriptionData.plan,
            returnUrl: `${window.location.origin}/inscription-reussie?success=true`
          }),
        })

        const checkoutData = await response.json()
        console.log('🟦 [CompleteProfile] Réponse Stripe ID:', executionId, 'Data:', checkoutData)

        if (!response.ok) {
          console.error('🔴 [CompleteProfile] Erreur Stripe checkout ID:', executionId, 'Error:', checkoutData)
          throw new Error(checkoutData.error || 'Erreur lors de la création de la session de paiement')
        }

        console.log('🟦 [CompleteProfile] ✅ Session checkout créée, nettoyage localStorage - ID:', executionId)

        // ÉTAPE 3 : Nettoyer localStorage maintenant que tout est OK
        clearSavedData()

        console.log('🟦 [CompleteProfile] 🔄 Redirection vers:', checkoutData.url, '- ID:', executionId)
        
        // ÉTAPE 4 : Rediriger vers Stripe Checkout
        if (checkoutData.url) {
          setTimeout(() => {
            console.log('🟦 [CompleteProfile] 🌐 Redirection effective - ID:', executionId)
            window.location.href = checkoutData.url
          }, 100)
        }
      } else {
        console.log('🔴 [CompleteProfile] ❌ Onboarding a échoué - ID:', executionId, 'Result:', result)
        throw new Error(result.error || "Erreur lors de la finalisation du profil")
      }
    } catch (error) {
      console.error('🔴 [CompleteProfile] Erreur lors de la finalisation avec abonnement - ID:', executionId, 'Error:', error)
      
      // Gestion d'erreur détaillée (même logique que register-container)
      let errorMessage = "Une erreur inattendue s'est produite. Veuillez réessayer."
      
      if (error instanceof Error) {
        console.log('🔴 [CompleteProfile] Message d\'erreur - ID:', executionId, 'Message:', error.message)
        
        if (error.message.includes("validation") || error.message.includes("invalides")) {
          errorMessage = "Veuillez vérifier que tous les champs obligatoires sont remplis correctement."
        } else if (error.message.includes("utilisateur")) {
          errorMessage = "Problème avec votre compte. Veuillez recommencer l'inscription."
        } else if (error.message.includes("stripe") || error.message.includes("paiement")) {
          errorMessage = "Erreur lors du traitement du paiement. Votre profil a été créé mais l'abonnement n'a pas pu être activé."
        } else if (error.message.includes("existe déjà") || error.message.includes("already exists")) {
          console.log('🟨 [CompleteProfile] Profil existe déjà - redirection - ID:', executionId)
          clearSavedData()
          toast.success("Votre profil existe déjà ! Redirection vers votre tableau de bord.")
          router.push("/tableau-de-bord?welcome=true")
          return
        } else {
          errorMessage = error.message
        }
      }
      
      console.log('🔴 [CompleteProfile] Toast erreur affiché - ID:', executionId, 'Message:', errorMessage)
      toast.error(errorMessage)
    } finally {
      console.log('🟦 [CompleteProfile] Finally block - ID:', executionId, 'URL actuelle:', typeof window !== 'undefined' ? window.location.href : 'undefined')
      if (typeof window !== 'undefined' && !window.location.href.includes('/inscription-reussie')) {
        console.log('🟦 [CompleteProfile] setIsLoading(false) - ID:', executionId)
        setIsLoading(false)
      } else {
        console.log('🟦 [CompleteProfile] Skip setIsLoading car redirection - ID:', executionId)
      }
    }
  }

  // Handler pour "skip" l'abonnement (même logique que register-container)
  const handleSkipSubscription = async () => {
    setIsLoading(true)
    
    try {
      console.log('🟦 [CompleteProfile] 🔄 Skip abonnement - finalisation sans paiement')
      
      await finalizeProfileWithoutPayment(formData)
    } catch (error) {
      console.error('🔴 [CompleteProfile] Erreur lors du skip:', error)
      toast.error("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour finaliser le profil sans paiement
  const finalizeProfileWithoutPayment = async (finalFormData: FormData) => {
    setIsLoading(true)
    try {
      // Préparer les données pour l'API
      const onboardingData = {
        userId: session.user.id,
        role: session.user.role,
        personalInfo: finalFormData.personalInfo || {}, // S'assurer que c'est un objet vide et non undefined
        activity: finalFormData.activity,
        bio: finalFormData.bio,
        services: finalFormData.services,
        schedule: finalFormData.schedule,
        preferences: finalFormData.preferences || {
          notifications: {
            email: {
              bookingConfirmation: true,
              bookingReminder: true,
              bookingCancellation: true,
              newsletter: false,
              promotions: false,
            },
            sms: {
              bookingConfirmation: false,
              bookingReminder: false,
              bookingCancellation: false,
            }
          },
          privacy: {
            showProfile: true,
            showAvailability: true
          }
        }
      }

      console.log("Sending onboarding data:", onboardingData)

      const result = await completeOnboarding(onboardingData)
      
      if (result.success) {
        clearSavedData() // Nettoyer les données après succès
        toast.success("Profil complété avec succès !")
        
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

            {/* Stepper avec icônes (ajout du prop includeSubscription pour les professionnels) */}
            <CompletionStepper 
              userType={session.user.role}
              currentStep={currentStep}
              includeSubscription={session.user.role === UserRole.PROFESSIONAL}
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

            {/* Étape Abonnement - uniquement pour les professionnels à l'étape 7 */}
            {currentStep === 7 && session.user.role === UserRole.PROFESSIONAL && (
              <SubscriptionStep 
                selectedPlan={selectedPlan}
                onSubmit={handleSubscriptionSubmit} 
                onSkip={handleSkipSubscription}
                onBack={handleBack} 
                isLoading={isLoading}
                userInfo={{
                  name: formData.personalInfo?.name,
                  email: session.user.email || undefined
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}