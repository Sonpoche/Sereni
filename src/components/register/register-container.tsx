// src/components/register/register-container.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { UserRole } from "@prisma/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { toast } from "sonner"
import { User, Users, ArrowLeft, Check, Clock, Users2, Calendar, Zap, Shield, Sparkles, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import AccountForm from "./steps/account-form"
import PersonalInfoForm from "./steps/personal-info"
import ActivityForm from "./steps/activity-form"
import BioForm from "./steps/bio-form"
import PreferencesForm from "./steps/preferences-form"
import ServicesSetup from "./steps/services-setup"
import SubscriptionStep from "./steps/subscription-step"
import type { PreferencesFormData } from "./steps/preferences-form"
import { cn } from "@/lib/utils"

// Interface FormData mise à jour
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
  schedule?: {
    workingDays: number[];
    startTime: string;
    endTime: string;
    isFullWeek: boolean;
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

// Clés pour le localStorage
const STORAGE_KEYS = {
  FORM_DATA: 'serenibook_onboarding_data',
  CURRENT_STEP: 'serenibook_onboarding_step',
  SELECTED_ROLE: 'serenibook_onboarding_role',
  SELECTED_PLAN: 'serenibook_selected_plan'
}

export default function RegisterContainer({ 
  initialStep = 1,
  initialRole
}: RegisterContainerProps) {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole || null)
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('premium')
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const [userIdFixed, setUserIdFixed] = useState(false)
  const isInitialized = useRef(false)
  const router = useRouter()
  const { register, completeOnboarding } = useAuth()

  // useEffect pour récupérer le plan sélectionné
  useEffect(() => {
    // Récupérer depuis les paramètres URL
    const planFromUrl = searchParams.get('plan') as 'standard' | 'premium'
    if (planFromUrl && (planFromUrl === 'standard' || planFromUrl === 'premium')) {
      setSelectedPlan(planFromUrl)
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, planFromUrl)
      }
    } else {
      // Récupérer depuis localStorage si pas dans URL
      if (typeof window !== 'undefined') {
        const savedPlan = localStorage.getItem(STORAGE_KEYS.SELECTED_PLAN) as 'standard' | 'premium'
        if (savedPlan && (savedPlan === 'standard' || savedPlan === 'premium')) {
          setSelectedPlan(savedPlan)
        }
      }
    }
  }, [searchParams])

  // useEffect de restauration des données
  useEffect(() => {
    console.log('🔄 [RegisterContainer] useEffect déclenché avec:', {
      status,
      'session?.user?.id': session?.user?.id,
      'formData.userId': formData.userId,
      userIdFixed,
      hasRestoredData,
      isInitialized: isInitialized.current
    })
    
    if (typeof window !== 'undefined' && !isInitialized.current) {
      isInitialized.current = true;

      try {
        console.log('🟦 [RegisterContainer] DÉBUT useEffect restauration')
        
        const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA)
        const savedUserId = savedFormData ? JSON.parse(savedFormData).userId : null
        
        if (savedUserId && status === "unauthenticated") {
          console.log("🧹 Utilisateur déconnecté - nettoyage automatique")
          clearSavedData()
          setHasRestoredData(true)
          return
        }

        if (savedUserId && status === "authenticated" && session?.user?.id !== savedUserId) {
          console.log("🧹 Utilisateur différent - nettoyage")
          clearSavedData()
          setHasRestoredData(true)
          return
        }

        if (savedFormData && (status === "authenticated" || status === "loading")) {
          const parsedData = JSON.parse(savedFormData)
          console.log('🟦 [RegisterContainer] Restauration données localStorage:', parsedData)
          setFormData(parsedData)
        }

        if (initialStep === 1 && !isLoading) {
          const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
          if (savedStep && (status === "authenticated" || (savedUserId && status === "loading"))) {
            const stepNumber = parseInt(savedStep)
            if (stepNumber > currentStep) {
              console.log('🟦 [RegisterContainer] Restauration étape:', stepNumber)
              setCurrentStep(stepNumber)
            }
          }
        }

        if (!initialRole) {
          const savedRole = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE)
          if (savedRole && Object.values(UserRole).includes(savedRole as UserRole)) {
            console.log('🟦 [RegisterContainer] Restauration rôle:', savedRole)
            setSelectedRole(savedRole as UserRole)
          }
        }

        // Restauration du plan sélectionné
        const savedPlan = localStorage.getItem(STORAGE_KEYS.SELECTED_PLAN) as 'standard' | 'premium'
        if (savedPlan && (savedPlan === 'standard' || savedPlan === 'premium')) {
          console.log('🟦 [RegisterContainer] Restauration plan:', savedPlan)
          setSelectedPlan(savedPlan)
        }

        setHasRestoredData(true)

        const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
        if (savedFormData && status === "authenticated" && parseInt(savedStep || "1") > 1) {
          toast.success("Vos données ont été restaurées !", {
            description: "Vous pouvez continuer là où vous vous étiez arrêté."
          })
        }
        
        console.log('🟦 [RegisterContainer] ✅ Fin useEffect restauration')
      } catch (error) {
        console.error('🔴 [RegisterContainer] Erreur lors de la restauration des données:', error)
        clearSavedData()
        setHasRestoredData(true)
      }
    }
  }, [initialStep, initialRole, status, session, isLoading])

  // useEffect pour corriger le userId manquant
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && hasRestoredData && !userIdFixed && !formData.userId) {
      console.log('🟨 [RegisterContainer] CORRECTION: Utilisateur connecté sans userId dans formData')
      setFormData(prev => ({
        ...prev,
        userId: session.user.id
      }))
      setUserIdFixed(true)
    }
  }, [status, session?.user?.id, hasRestoredData, userIdFixed, formData.userId])

  // Nettoyer automatiquement si l'utilisateur se déconnecte
  useEffect(() => {
    if (status === "unauthenticated" && hasRestoredData) {
      const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA)
      if (savedFormData) {
        console.log("🧹 Utilisateur déconnecté - nettoyage automatique")
        clearSavedData()
        setCurrentStep(1)
        setSelectedRole(initialRole || null)
        setFormData({})
        setUserIdFixed(false)
        isInitialized.current = false
      }
    }
  }, [status, hasRestoredData, initialRole])

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (hasRestoredData && userIdFixed && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData))
        localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString())
        if (selectedRole) {
          localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, selectedRole)
        }
        if (selectedPlan) {
          localStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, selectedPlan)
        }
      } catch (error) {
        console.error('🔴 [RegisterContainer] Erreur lors de la sauvegarde:', error)
      }
    }
  }, [formData, currentStep, selectedRole, selectedPlan, hasRestoredData, userIdFixed])

  // Fonction pour nettoyer les données sauvegardées
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.FORM_DATA)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP)
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE)
      localStorage.removeItem(STORAGE_KEYS.SELECTED_PLAN)
    }
  }

  // Calcul du temps estimé basé sur le rôle et l'étape
  useEffect(() => {
    if (selectedRole === UserRole.CLIENT) {
      setEstimatedTime(2) // 2 minutes pour client
    } else {
      const remainingSteps = getSteps().length - currentStep + 1
      setEstimatedTime(remainingSteps * 1.5) // 1.5 min par étape
    }
  }, [selectedRole, currentStep])

  // Définition des étapes avec métadonnées UX
  const getSteps = () => {
    if (selectedRole === UserRole.CLIENT) {
      return [
        { 
          id: 1, 
          title: "Compte", 
          description: "Sécurisé", 
          icon: Shield,
          estimatedTime: "1 min"
        },
        { 
          id: 2, 
          title: "Informations", 
          description: "Vos coordonnées", 
          icon: User,
          estimatedTime: "1 min"
        },
        { 
          id: 3, 
          title: "Finalisation", 
          description: "C'est fini !", 
          icon: Sparkles,
          estimatedTime: "30s"
        }
      ]
    } else {
      return [
        { 
          id: 1, 
          title: "Compte", 
          description: "Sécurisé", 
          icon: Shield,
          estimatedTime: "1 min"
        },
        { 
          id: 2, 
          title: "Informations", 
          description: "Coordonnées", 
          icon: User,
          estimatedTime: "2 min"
        },
        { 
          id: 3, 
          title: "Activité", 
          description: "Votre métier", 
          icon: Users2,
          estimatedTime: "2 min"
        },
        { 
          id: 4, 
          title: "Présentation", 
          description: "Votre approche", 
          icon: Sparkles,
          estimatedTime: "3 min"
        },
        { 
          id: 5, 
          title: "Services", 
          description: "Vos prestations", 
          icon: Calendar,
          estimatedTime: "4 min"
        },
        { 
          id: 6, 
          title: "Préférences", 
          description: "Notifications", 
          icon: Zap,
          estimatedTime: "1 min"
        },
        { 
          id: 7, 
          title: "Abonnement", 
          description: "Choisir votre plan", 
          icon: CreditCard,
          estimatedTime: "2 min"
        }
      ]
    }
  }

  const steps = getSteps()
  const currentStepData = steps.find(step => step.id === currentStep)
  const progressPercentage = (currentStep / steps.length) * 100

  // Handlers pour les étapes
  const handleAccountSubmit = async (data: AccountFormData) => {
    if (!selectedRole) return;
    
    setIsLoading(true)
    try {
      console.log('🟦 [RegisterContainer] Début création compte pour:', data.email)
      
      const result = await register({
        email: data.email,
        password: data.password,
        name: "",
        role: selectedRole
      })

      if (!result?.user?.id) {
        throw new Error("Erreur lors de la création du compte - ID utilisateur manquant dans la réponse")
      }

      const userId = result.user.id
      const newFormData = {
        ...formData,
        account: {
          email: data.email,
          password: data.password
        },
        userId: userId
      }
      
      setFormData(newFormData)
      setUserIdFixed(true)

      if (selectedRole === UserRole.CLIENT) {
        clearSavedData()
        toast.success("Inscription réussie !")
        router.push("/tableau-de-bord")
      } else {
        toast.success("Compte créé avec succès ! Continuons votre configuration.")
        setTimeout(() => {
          setCurrentStep(2)
        }, 100)
      }
    } catch (error) {
      console.error('🔴 [RegisterContainer] Erreur lors de la création du compte:', error)
      
      if (error instanceof Error) {
        if (error.message.includes("ID utilisateur manquant")) {
          toast.error("Erreur technique lors de la création du compte. Veuillez réessayer.")
        } else if (error.message.includes("existe déjà")) {
          toast.error("Un compte existe déjà avec cet email.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Une erreur inattendue s'est produite lors de la création du compte")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePersonalInfoSubmit = async (data: any) => {
    setFormData(prev => ({ ...prev, personalInfo: data }))
    setCurrentStep(3)
  }

  const handleActivitySubmit = async (data: any) => {
    setFormData(prev => ({ ...prev, activity: data }))
    setCurrentStep(4)
  }

  const handleBioSubmit = async (data: any) => {
    setFormData(prev => ({ ...prev, bio: data }))
    setCurrentStep(5)
  }

  const handleServicesSubmit = async (data: any) => {
    setFormData(prev => ({ ...prev, services: data }))
    setCurrentStep(6)
  }

  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    console.log('🟦 [RegisterContainer] Soumission préférences - passage à étape 7')
    setFormData(prev => ({ ...prev, preferences: data }))
    setCurrentStep(7)
  }

  // Handler pour l'abonnement (étape 7) - AVEC DEBUG
  const handleSubscriptionSubmit = async (subscriptionData: { plan: 'standard' | 'premium' }) => {
    // Protection contre les double-clics
    if (isLoading) {
      console.log('🟨 [RegisterContainer] Double-clic détecté, ignoré')
      return
    }
    
    const executionId = Date.now()
    console.log('🟦 [RegisterContainer] 🚀 DÉBUT handleSubscriptionSubmit - ID:', executionId)
    setIsLoading(true)
    
    try {
      console.log('🟦 [RegisterContainer] Plan sélectionné:', subscriptionData.plan)
      
      // Déterminer le userId
      let userId = formData.userId;
      if (!userId && session?.user?.id) {
        userId = session.user.id;
        setFormData(prev => ({ ...prev, userId }));
      }

      if (!userId) {
        throw new Error("Impossible de déterminer l'ID utilisateur")
      }

      // Construction des données d'onboarding COMPLÈTES
      const onboardingData = {
        userId: userId,
        role: selectedRole!,
        personalInfo: formData.personalInfo || {},
        ...(selectedRole === UserRole.PROFESSIONAL && {
          activity: formData.activity || {
            type: "AUTRE",
            experience: 0
          },
          bio: formData.bio || {
            bio: "",
            approach: ""
          },
          services: formData.services || { services: [] },
          schedule: formData.schedule || undefined
        }),
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

      console.log('🟦 [RegisterContainer] 📤 Complétion onboarding AVANT paiement...')

      // ÉTAPE 1 : Compléter l'onboarding AVANT de créer l'abonnement
      console.log('🟦 [RegisterContainer] 🔄 Appel completeOnboarding... ID:', executionId)
      const result = await completeOnboarding(onboardingData)
      console.log('🟦 [RegisterContainer] 🔄 Retour completeOnboarding ID:', executionId, 'Result:', result)
      
      if (result.success) {
        console.log('🟦 [RegisterContainer] ✅ Onboarding complété avec succès - ID:', executionId)
        
        // Vérifier si le profil existait déjà
        if (result.message && result.message.includes("existe déjà")) {
          console.log('🟨 [RegisterContainer] Profil déjà existant, skip paiement - ID:', executionId)
          clearSavedData()
          toast.success("Profil déjà configuré ! Redirection vers votre tableau de bord.")
          router.push("/tableau-de-bord?welcome=true")
          return
        }
        
        toast.success("Profil créé avec succès !")
        
        // ÉTAPE 2 : Créer la session de checkout Stripe
        console.log('🟦 [RegisterContainer] 💳 Création session checkout Stripe... ID:', executionId)
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
        console.log('🟦 [RegisterContainer] Réponse Stripe ID:', executionId, 'Data:', checkoutData)

        if (!response.ok) {
          console.error('🔴 [RegisterContainer] Erreur Stripe checkout ID:', executionId, 'Error:', checkoutData)
          throw new Error(checkoutData.error || 'Erreur lors de la création de la session de paiement')
        }

        console.log('🟦 [RegisterContainer] ✅ Session checkout créée, nettoyage localStorage - ID:', executionId)

        // ÉTAPE 3 : Nettoyer localStorage maintenant que tout est OK
        clearSavedData()

        console.log('🟦 [RegisterContainer] 🔄 Redirection vers:', checkoutData.url, '- ID:', executionId)
        
        // ÉTAPE 4 : Rediriger vers Stripe Checkout ou page de succès
        if (checkoutData.url) {
          setTimeout(() => {
            console.log('🟦 [RegisterContainer] 🌐 Redirection effective - ID:', executionId)
            window.location.href = checkoutData.url
          }, 100)
        }
      } else {
        console.log('🔴 [RegisterContainer] ❌ Onboarding a échoué - ID:', executionId, 'Result:', result)
        throw new Error(result.error || "Erreur lors de la finalisation du profil")
      }
    } catch (error) {
      console.error('🔴 [RegisterContainer] Erreur lors de la finalisation avec abonnement - ID:', executionId, 'Error:', error)
      
      // Gestion d'erreur détaillée
      let errorMessage = "Une erreur inattendue s'est produite. Veuillez réessayer."
      
      if (error instanceof Error) {
        console.log('🔴 [RegisterContainer] Message d\'erreur - ID:', executionId, 'Message:', error.message)
        
        if (error.message.includes("validation") || error.message.includes("invalides")) {
          errorMessage = "Veuillez vérifier que tous les champs obligatoires sont remplis correctement."
        } else if (error.message.includes("utilisateur")) {
          errorMessage = "Problème avec votre compte. Veuillez recommencer l'inscription."
        } else if (error.message.includes("stripe") || error.message.includes("paiement")) {
          errorMessage = "Erreur lors du traitement du paiement. Votre profil a été créé mais l'abonnement n'a pas pu être activé."
        } else if (error.message.includes("existe déjà") || error.message.includes("already exists")) {
          console.log('🟨 [RegisterContainer] Profil existe déjà - redirection - ID:', executionId)
          clearSavedData()
          toast.success("Votre profil existe déjà ! Redirection vers votre tableau de bord.")
          router.push("/tableau-de-bord?welcome=true")
          return
        } else {
          errorMessage = error.message
        }
      }
      
      console.log('🔴 [RegisterContainer] Toast erreur affiché - ID:', executionId, 'Message:', errorMessage)
      toast.error(errorMessage)
    } finally {
      console.log('🟦 [RegisterContainer] Finally block - ID:', executionId, 'URL actuelle:', typeof window !== 'undefined' ? window.location.href : 'undefined')
      if (typeof window !== 'undefined' && !window.location.href.includes('/inscription-reussie')) {
        console.log('🟦 [RegisterContainer] setIsLoading(false) - ID:', executionId)
        setIsLoading(false)
      } else {
        console.log('🟦 [RegisterContainer] Skip setIsLoading car redirection - ID:', executionId)
      }
    }
  }

  // Handler pour "skip" l'abonnement
  const handleSkipSubscription = async () => {
    setIsLoading(true)
    
    try {
      console.log('🟦 [RegisterContainer] 🔄 Skip abonnement - finalisation sans paiement')
      
      let userId = formData.userId;
      if (!userId && session?.user?.id) {
        userId = session.user.id;
        setFormData(prev => ({ ...prev, userId }));
      }

      if (!userId) {
        throw new Error("Impossible de déterminer l'ID utilisateur")
      }

      // Même logique d'onboarding mais sans abonnement
      const onboardingData = {
        userId: userId,
        role: selectedRole!,
        personalInfo: formData.personalInfo || {},
        ...(selectedRole === UserRole.PROFESSIONAL && {
          activity: formData.activity || {
            type: "AUTRE",
            experience: 0
          },
          bio: formData.bio || {
            bio: "",
            approach: ""
          },
          services: formData.services || { services: [] },
          schedule: formData.schedule || undefined
        }),
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

      const result = await completeOnboarding(onboardingData)
      
      if (result.success) {
        clearSavedData()
        toast.success("Profil créé avec succès ! Vous pourrez configurer votre abonnement plus tard.")
        router.push("/tableau-de-bord?welcome=true")
      } else {
        throw new Error(result.error || "Erreur lors de la finalisation")
      }
    } catch (error) {
      console.error('🔴 [RegisterContainer] Erreur lors du skip:', error)
      toast.error("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRoleReset = () => {
    // Demander confirmation avant de reset
    if (formData.account || currentStep > 1) {
      const confirmed = window.confirm(
        "Êtes-vous sûr de vouloir recommencer ? Vos données seront perdues."
      )
      if (!confirmed) return
    }
    
    setSelectedRole(null)
    setCurrentStep(1)
    setFormData({})
    setUserIdFixed(false)
    isInitialized.current = false
    clearSavedData()
  }

  // renderStep avec toutes les étapes
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AccountForm onSubmit={handleAccountSubmit} isLoading={isLoading} initialData={formData.account} />
      case 2:
        return <PersonalInfoForm userType={selectedRole!} onSubmit={handlePersonalInfoSubmit} onBack={handleBack} initialData={formData.personalInfo} isLoading={isLoading} />
      case 3:
        if (selectedRole === UserRole.CLIENT) {
          return (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Bienvenue sur SereniBook !</h2>
              <p className="text-xl text-gray-600 max-w-md mx-auto">
                Votre compte est prêt. Découvrez maintenant tous nos professionnels du bien-être.
              </p>
              <Button size="lg" onClick={() => router.push("/tableau-de-bord")} className="mt-6">
                Commencer mon voyage bien-être
              </Button>
            </div>
          )
        } else {
          return <ActivityForm onSubmit={handleActivitySubmit} onBack={handleBack} initialData={formData.activity} isLoading={isLoading} />
        }
      case 4:
        return <BioForm onSubmit={handleBioSubmit} onBack={handleBack} initialData={formData.bio} isLoading={isLoading} />
      case 5:
        return <ServicesSetup professionalType={formData.activity?.type} onSubmit={handleServicesSubmit} onBack={handleBack} initialData={formData.services} isLoading={isLoading} />
      case 6:
        return <PreferencesForm userType={selectedRole!} onSubmit={handlePreferencesSubmit} onBack={handleBack} initialData={formData.preferences} isLoading={isLoading} />
      case 7:
        return <SubscriptionStep 
          selectedPlan={selectedPlan}
          onSubmit={handleSubscriptionSubmit} 
          onSkip={handleSkipSubscription}
          onBack={handleBack} 
          isLoading={isLoading}
          userInfo={{
            name: formData.personalInfo?.name,
            email: formData.account?.email
          }}
        />
      default:
        return null
    }
  }

  // Page de sélection de rôle minimaliste
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto">
            {/* Header minimaliste */}
            <div className="text-center mb-20">
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Rejoignez SereniBook
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choisissez votre type de compte pour commencer
              </p>
            </div>

            {/* Stats minimalistes */}
            <div className="flex justify-center items-center space-x-12 mb-16 text-sm text-gray-500">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div>Utilisateurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div>Professionnels</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div>Satisfaction</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Carte Client */}
              <button
                onClick={() => setSelectedRole(UserRole.CLIENT)}
                className="group relative p-12 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left bg-white"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Inscription en</div>
                    <div className="font-medium text-gray-900">2 minutes</div>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Je suis un client
                </h3>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  Accédez à un réseau de professionnels, réservez en ligne et suivez vos rendez-vous.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                    <span>Réservation en ligne</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                    <span>Cours collectifs</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                    <span>Suivi personnalisé</span>
                  </div>
                </div>
              </button>

              {/* Carte Professionnel */}
              <button
                onClick={() => {
                  // Rediriger vers choix d'abonnement au lieu de setSelectedRole
                  router.push('/choix-abonnement')
                }}
                className="group relative p-12 rounded-2xl border border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-300 text-left bg-white"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Configuration en</div>
                    <div className="font-medium text-gray-900">12 minutes</div>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Je suis un professionnel
                </h3>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  Développez votre activité avec nos outils de gestion complets.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                    <span>Planning automatisé</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                    <span>Services + cours collectifs</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                    <span>Facturation intégrée</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer minimaliste */}
            <div className="mt-16 text-center">
              <p className="text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link 
                  href="/connexion" 
                  className="text-gray-900 hover:text-gray-700 font-medium underline underline-offset-4"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header minimaliste */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-12">
              <Button
                variant="ghost"
                onClick={() => {
                  if (currentStep === 1) {
                    handleRoleReset()
                  } else {
                    handleBack()
                  }
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStep === 1 ? "Changer de type de compte" : "Précédent"}
              </Button>

              {/* Indicateur de temps minimaliste */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Environ {Math.ceil(estimatedTime)} min restantes</span>
              </div>
            </div>

            {/* Titre contextuel */}
            <div className="text-center mb-16">
              <div className="text-sm text-gray-500 mb-2">
                Étape {currentStep} sur {steps.length}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {currentStepData?.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {selectedRole === UserRole.CLIENT 
                  ? "Configurons votre compte pour une expérience optimale"
                  : "Créons ensemble votre profil professionnel attractif"
                }
              </p>
            </div>

            {/* Stepper minimaliste avec couleurs */}
            <div className="relative mb-20 max-w-6xl mx-auto">
              {/* Barre de progression */}
              <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200">
                <div 
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Étapes avec icônes colorées */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => {
                  const isActive = step.id === currentStep
                  const isCompleted = step.id < currentStep
                  const isUpcoming = step.id > currentStep
                  const StepIcon = step.icon

                  return (
                    <div 
                      key={step.id}
                      className="flex flex-col items-center"
                      style={{ zIndex: 10 }}
                    >
                      {/* Cercle avec icône colorée */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                          isCompleted && "border-primary bg-primary text-white",
                          isActive && "border-primary text-primary shadow-lg",
                          isUpcoming && "border-gray-200 text-gray-400"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>

                      {/* Texte */}
                      <div className="mt-3 text-center max-w-28">
                        <div 
                          className={cn(
                            "text-sm font-medium transition-colors",
                            isActive && "text-gray-900",
                            isCompleted && "text-gray-600",
                            isUpcoming && "text-gray-400"
                          )}
                        >
                          {step.title}
                        </div>
                        <div 
                          className={cn(
                            "text-xs mt-1 transition-colors",
                            isActive && "text-gray-600",
                            isCompleted && "text-gray-500",
                            isUpcoming && "text-gray-300"
                          )}
                        >
                          {step.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Contenu principal plus large */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-16 max-w-6xl mx-auto">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  )
}