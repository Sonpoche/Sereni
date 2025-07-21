// src/components/register/register-container.tsx
"use client"

import { useState, useEffect } from "react"
import { UserRole } from "@prisma/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { toast } from "sonner"
import { User, Users, ArrowLeft, Check, Clock, Users2, Calendar, Zap, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import AccountForm from "./steps/account-form"
import PersonalInfoForm from "./steps/personal-info"
import ActivityForm from "./steps/activity-form"
import BioForm from "./steps/bio-form"
import PreferencesForm from "./steps/preferences-form"
import ServicesSetup from "./steps/services-setup"
import type { PreferencesFormData } from "./steps/preferences-form"
import { cn } from "@/lib/utils"

// ✅ Interface FormData corrigée avec schedule
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
  // ✅ AJOUT : Interface schedule manquante
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
  SELECTED_ROLE: 'serenibook_onboarding_role'
}

export default function RegisterContainer({ 
  initialStep = 1,
  initialRole
}: RegisterContainerProps) {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole || null)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const [userIdFixed, setUserIdFixed] = useState(false) // ✅ AJOUT : Protection contre boucle infinie
  const router = useRouter()
  const { register, completeOnboarding } = useAuth()

  // Récupérer le plan depuis l'URL
  const selectedPlan = searchParams.get('plan') as 'standard' | 'premium' | null

  // Restaurer les données avec vérification de session
  useEffect(() => {
    console.log('🔄 [RegisterContainer] useEffect déclenché avec:', {
      status,
      'session?.user?.id': session?.user?.id,
      'formData.userId': formData.userId,
      userIdFixed,
      hasRestoredData
    })
    
    if (typeof window !== 'undefined') {
      try {
        console.log('🟦 [RegisterContainer] ================================')
        console.log('🟦 [RegisterContainer] DÉBUT useEffect restauration')
        console.log('🟦 [RegisterContainer] ================================')
        console.log('🟦 [RegisterContainer] status:', status)
        console.log('🟦 [RegisterContainer] session:', session)
        console.log('🟦 [RegisterContainer] initialStep:', initialStep)
        console.log('🟦 [RegisterContainer] initialRole:', initialRole)
        
        // ✅ CORRECTION MAJEURE : Si l'utilisateur est connecté mais pas d'userId dans formData
        if (status === "authenticated" && session?.user?.id && !formData.userId && !userIdFixed) {
          console.log('🟨 [RegisterContainer] CORRECTION: Utilisateur connecté sans userId dans formData')
          console.log('🟨 [RegisterContainer] Récupération userId depuis session:', session.user.id)
          
          // Mettre à jour le formData avec l'userId de la session
          const newFormData = {
            ...formData,
            userId: session.user.id
          }
          
          console.log('🟨 [RegisterContainer] Mise à jour formData avec userId de session')
          setFormData(newFormData)
          setUserIdFixed(true) // ✅ Marquer comme corrigé pour éviter la boucle
          setHasRestoredData(true)
          return
        }

        // Vérifier d'abord si l'utilisateur est connecté
        const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA)
        const savedUserId = savedFormData ? JSON.parse(savedFormData).userId : null
        
        console.log('🟦 [RegisterContainer] savedFormData:', savedFormData)
        console.log('🟦 [RegisterContainer] savedUserId:', savedUserId)
        
        // Si on a un userId sauvegardé mais qu'aucune session n'est active, nettoyer
        if (savedUserId && status === "unauthenticated") {
          console.log("🧹 Nettoyage - utilisateur déconnecté")
          clearSavedData()
          setHasRestoredData(true)
          return
        }

        // Si on est connecté mais que le userId sauvegardé ne correspond pas, nettoyer
        if (savedUserId && status === "authenticated" && session?.user?.id !== savedUserId) {
          console.log("🧹 Nettoyage - utilisateur différent")
          clearSavedData()
          setHasRestoredData(true)
          return
        }

        // Restaurer les données seulement si l'utilisateur est connecté ET correspond
        if (savedFormData && (status === "authenticated" || status === "loading")) {
          const parsedData = JSON.parse(savedFormData)
          console.log('🟦 [RegisterContainer] Restauration données localStorage:', parsedData)
          setFormData(parsedData)
        }

        // Restaurer l'étape seulement si on n'a pas d'initialStep ET si on n'est pas en train de créer un compte
        if (initialStep === 1 && !isLoading) {
          const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
          // Restaurer l'étape seulement si on a un userId correspondant
          if (savedStep && (status === "authenticated" || (savedUserId && status === "loading"))) {
            const stepNumber = parseInt(savedStep)
            // Ne pas revenir en arrière si on est déjà plus loin
            if (stepNumber > currentStep) {
              console.log('🟦 [RegisterContainer] Restauration étape:', stepNumber)
              setCurrentStep(stepNumber)
            }
          }
        }

        // Restaurer le rôle sélectionné (si pas de props initialRole)
        if (!initialRole) {
          const savedRole = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE)
          if (savedRole && Object.values(UserRole).includes(savedRole as UserRole)) {
            console.log('🟦 [RegisterContainer] Restauration rôle:', savedRole)
            setSelectedRole(savedRole as UserRole)
          }
        }

        setHasRestoredData(true)

        // Afficher un message si des données ont été restaurées
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
  }, [initialStep, initialRole, status, session, isLoading]) // ✅ SUPPRESSION de formData.userId des dépendances

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
      }
    }
  }, [status, hasRestoredData, initialRole])

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (hasRestoredData && typeof window !== 'undefined') {
      try {
        console.log('🟦 [RegisterContainer] 💾 Sauvegarde localStorage...')
        console.log('🟦 [RegisterContainer] - formData à sauvegarder:', JSON.stringify(formData, null, 2))
        console.log('🟦 [RegisterContainer] - formData.userId:', formData.userId)
        console.log('🟦 [RegisterContainer] - currentStep:', currentStep)
        console.log('🟦 [RegisterContainer] - selectedRole:', selectedRole)
        
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData))
        localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString())
        if (selectedRole) {
          localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, selectedRole)
        }
        
        console.log('🟦 [RegisterContainer] ✅ Sauvegarde localStorage terminée')
        
        // Vérifier immédiatement que la sauvegarde a fonctionné
        const savedData = localStorage.getItem(STORAGE_KEYS.FORM_DATA)
        if (savedData) {
          const parsed = JSON.parse(savedData)
          console.log('🟦 [RegisterContainer] 🔍 Vérification sauvegarde - userId dans localStorage:', parsed.userId)
        }
      } catch (error) {
        console.error('🔴 [RegisterContainer] Erreur lors de la sauvegarde:', error)
      }
    }
  }, [formData, currentStep, selectedRole, hasRestoredData])

  // Fonction pour nettoyer les données sauvegardées
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.FORM_DATA)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP)
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE)
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
          description: "Finalisation", 
          icon: Zap,
          estimatedTime: "1 min"
        }
      ]
    }
  }

  const steps = getSteps()
  const currentStepData = steps.find(step => step.id === currentStep)
  const progressPercentage = (currentStep / steps.length) * 100

  // Handlers avec sauvegarde automatique
  const handleAccountSubmit = async (data: AccountFormData) => {
    if (!selectedRole) return;
    
    setIsLoading(true)
    try {
      console.log('🟦 [RegisterContainer] ================================')
      console.log('🟦 [RegisterContainer] DÉBUT handleAccountSubmit')
      console.log('🟦 [RegisterContainer] ================================')
      console.log('🟦 [RegisterContainer] Début création compte pour:', data.email)
      console.log('🟦 [RegisterContainer] selectedRole:', selectedRole)
      
      const result = await register({
        email: data.email,
        password: data.password,
        name: "",
        role: selectedRole
      })

      console.log('🟦 [RegisterContainer] ✅ Résultat inscription COMPLET:', JSON.stringify(result, null, 2))

      // ✅ CORRECTION : Vérifier que nous avons bien l'userId
      if (!result?.user?.id) {
        console.error('🔴 [RegisterContainer] ❌ Pas d\'userId dans la réponse!')
        console.error('🔴 [RegisterContainer] Structure result:', result)
        console.error('🔴 [RegisterContainer] result.user:', result?.user)
        throw new Error("Erreur lors de la création du compte - ID utilisateur manquant dans la réponse")
      }

      const userId = result.user.id
      console.log('🟦 [RegisterContainer] ✅ userId récupéré avec succès:', userId)

      const newFormData = {
        ...formData,
        account: {
          email: data.email,
          password: data.password
        },
        userId: userId
      }
      
      console.log('🟦 [RegisterContainer] ✅ Nouveau FormData créé:')
      console.log('🟦 [RegisterContainer] - userId:', newFormData.userId)
      console.log('🟦 [RegisterContainer] - account:', newFormData.account)
      console.log('🟦 [RegisterContainer] - FormData complet:', JSON.stringify(newFormData, null, 2))
      
      setFormData(newFormData)
      console.log('🟦 [RegisterContainer] ✅ FormData mis à jour dans le state')

      // Vérifier que le state a bien été mis à jour
      setTimeout(() => {
        console.log('🟦 [RegisterContainer] 🔍 Vérification formData après setState...')
        console.log('🟦 [RegisterContainer] formData.userId après setState:', formData.userId)
      }, 100)

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
      console.error('🔴 [RegisterContainer] ================================')
      console.error('🔴 [RegisterContainer] ERREUR dans handleAccountSubmit')
      console.error('🔴 [RegisterContainer] ================================')
      console.error('🔴 [RegisterContainer] Error object:', error)
      console.error('🔴 [RegisterContainer] Erreur lors de la création du compte:', error)
      
      // ✅ Messages d'erreur plus spécifiques
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

  // ✅ CORRECTION : Gestion du paiement après l'onboarding avec données complètes
  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    console.log('🟦 [RegisterContainer] ================================')
    console.log('🟦 [RegisterContainer] 🚀 DÉBUT handlePreferencesSubmit')
    console.log('🟦 [RegisterContainer] ================================')
    console.log('🟦 [RegisterContainer] 📊 ÉTAT INITIAL:')
    console.log('🟦 [RegisterContainer] - selectedRole:', selectedRole)
    console.log('🟦 [RegisterContainer] - selectedPlan:', selectedPlan)
    console.log('🟦 [RegisterContainer] - session?.user?.id:', session?.user?.id)
    console.log('🟦 [RegisterContainer] - session status:', status)
    console.log('🟦 [RegisterContainer] - userIdFixed:', userIdFixed)
    console.log('🟦 [RegisterContainer] - hasRestoredData:', hasRestoredData)
    console.log('🟦 [RegisterContainer] - formData.userId AVANT:', formData.userId)
    console.log('🟦 [RegisterContainer] - formData COMPLET:', JSON.stringify(formData, null, 2))
    console.log('🟦 [RegisterContainer] - Données préférences reçues:', JSON.stringify(data, null, 2))
    console.log('🟦 [RegisterContainer] ================================')
    
    setIsLoading(true)
    
    try {
      console.log('🟦 [RegisterContainer] Début de la soumission des préférences')
      console.log('🟦 [RegisterContainer] FormData actuel:', formData)
      console.log('🟦 [RegisterContainer] Données de préférences:', data)
      
      const finalData = { ...formData, preferences: data }
      
      // Validation des données avant envoi
      if (!finalData.userId) {
        throw new Error("ID utilisateur manquant. Veuillez recommencer l'inscription.")
      }

      if (!selectedRole) {
        throw new Error("Rôle utilisateur non sélectionné. Veuillez recommencer l'inscription.")
      }

      // ✅ CORRECTION : Construction des données d'onboarding avec valeurs par défaut et schedule
      const onboardingData = {
        userId: finalData.userId,
        role: selectedRole,
        // Garantir que personalInfo existe toujours
        personalInfo: finalData.personalInfo || {},
        // Pour les professionnels, s'assurer que les données métier sont présentes
        ...(selectedRole === UserRole.PROFESSIONAL && {
          activity: finalData.activity || {
            type: "AUTRE",
            experience: 0
          },
          bio: finalData.bio || {
            bio: "",
            approach: ""
          },
          services: finalData.services || { services: [] },
          schedule: finalData.schedule || undefined // ✅ FIX : schedule maintenant inclus
        }),
        // Préférences avec valeurs par défaut robustes
        preferences: {
          notifications: {
            email: {
              bookingConfirmation: data.notifications?.email?.bookingConfirmation ?? true,
              bookingReminder: data.notifications?.email?.bookingReminder ?? true,
              bookingCancellation: data.notifications?.email?.bookingCancellation ?? true,
              newsletter: data.notifications?.email?.newsletter ?? false,
              promotions: data.notifications?.email?.promotions ?? false,
            },
            sms: {
              bookingConfirmation: data.notifications?.sms?.bookingConfirmation ?? false,
              bookingReminder: data.notifications?.sms?.bookingReminder ?? false,
              bookingCancellation: data.notifications?.sms?.bookingCancellation ?? false,
            }
          },
          privacy: data.privacy || {
            showProfile: true,
            showAvailability: true
          }
        }
      }

      console.log('🟦 [RegisterContainer] Données d\'onboarding préparées:', onboardingData)

      // Validation finale avant envoi
      if (selectedRole === UserRole.PROFESSIONAL) {
        // Vérifier que les données essentielles pour un professionnel sont présentes
        if (!onboardingData.activity) {
          console.warn('🟨 [RegisterContainer] Activité manquante pour professionnel, utilisation de valeurs par défaut')
        }
        if (!onboardingData.bio) {
          console.warn('🟨 [RegisterContainer] Bio manquante pour professionnel, utilisation de valeurs par défaut')
        }
      }

      const result = await completeOnboarding(onboardingData)
      
      if (result.success) {
        toast.success("Profil créé avec succès !")
        
        // ✅ CORRECTION : Ne PAS nettoyer les données si on va vers paiement
        // Si professionnel avec plan, rediriger vers paiement SANS nettoyer
        if (selectedRole === UserRole.PROFESSIONAL && selectedPlan) {
          // Sauvegarder le plan pour le paiement
          localStorage.setItem('serenibook_selected_plan', selectedPlan)
          localStorage.setItem('serenibook_subscription_flow', 'true')
          console.log('🟦 [RegisterContainer] Redirection vers finalisation abonnement SANS nettoyer localStorage')
          router.push('/finaliser-abonnement')
        } else {
          // Redirection normale - on peut nettoyer
          clearSavedData() 
          console.log('🟦 [RegisterContainer] Redirection vers tableau de bord')
          router.push("/tableau-de-bord")
        }
      } else {
        throw new Error(result.error || "Erreur lors de la finalisation")
      }
    } catch (error) {
      console.error('🔴 [RegisterContainer] Erreur lors de la finalisation:', error)
      
      // Messages d'erreur plus informatifs
      if (error instanceof Error) {
        if (error.message.includes("validation") || error.message.includes("invalides")) {
          toast.error("Veuillez vérifier que tous les champs obligatoires sont remplis correctement.")
        } else if (error.message.includes("utilisateur")) {
          toast.error("Problème avec votre compte. Veuillez recommencer l'inscription.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Une erreur inattendue s'est produite. Veuillez réessayer.")
      }
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
    clearSavedData()
  }

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

            {/* Sélection de rôle large */}
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
                onClick={() => setSelectedRole(UserRole.PROFESSIONAL)}
                className="group relative p-12 rounded-2xl border border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-300 text-left bg-white"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Configuration en</div>
                    <div className="font-medium text-gray-900">10 minutes</div>
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

            {/* Indicateur de plan sélectionné */}
            {selectedRole === UserRole.PROFESSIONAL && selectedPlan && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-primary/10 text-primary border border-primary/20">
                  <Shield className="h-4 w-4 mr-2" />
                  Plan sélectionné : {selectedPlan === 'standard' ? 'Standard (20€/mois)' : 'Premium (40€/mois)'}
                </div>
              </div>
            )}

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