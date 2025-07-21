// src/components/register/register-container.tsx
"use client"

import { useState, useEffect } from "react"
import { UserRole } from "@prisma/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react" // ✅ AJOUTÉ
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
  const { data: session, status } = useSession() // ✅ AJOUTÉ
  const searchParams = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole || null)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const router = useRouter()
  const { register, completeOnboarding } = useAuth()

  // Récupérer le plan depuis l'URL
  const selectedPlan = searchParams.get('plan') as 'standard' | 'premium' | null

  // ✅ MODIFIÉ: Restaurer les données avec vérification de session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Vérifier d'abord si l'utilisateur est connecté
        const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA)
        const savedUserId = savedFormData ? JSON.parse(savedFormData).userId : null
        
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
          setFormData(parsedData)
        }

        // ✅ CORRECTION: Restaurer l'étape seulement si on n'a pas d'initialStep ET si on n'est pas en train de créer un compte
        if (initialStep === 1 && !isLoading) { // ✅ AJOUTÉ: !isLoading pour éviter l'interférence
          const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
          // Restaurer l'étape seulement si on a un userId correspondant
          if (savedStep && (status === "authenticated" || (savedUserId && status === "loading"))) {
            const stepNumber = parseInt(savedStep)
            // ✅ SÉCURITÉ: Ne pas revenir en arrière si on est déjà plus loin
            if (stepNumber > currentStep) {
              setCurrentStep(stepNumber)
            }
          }
        }

        // Restaurer le rôle sélectionné (si pas de props initialRole)
        if (!initialRole) {
          const savedRole = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE)
          if (savedRole && Object.values(UserRole).includes(savedRole as UserRole)) {
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
      } catch (error) {
        console.error('Erreur lors de la restauration des données:', error)
        clearSavedData()
        setHasRestoredData(true)
      }
    }
  }, [initialStep, initialRole, status, session, isLoading]) // ✅ AJOUTÉ: isLoading aux dépendances

  // ✅ NOUVEAU: Nettoyer automatiquement si l'utilisateur se déconnecte
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
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData))
        localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString())
        if (selectedRole) {
          localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, selectedRole)
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
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
      const result = await register({
        email: data.email,
        password: data.password,
        name: "",
        role: selectedRole
      })

      const newFormData = {
        ...formData,
        account: {
          email: data.email,
          password: data.password
        },
        userId: result.user.id
      }
      setFormData(newFormData)

      if (selectedRole === UserRole.CLIENT) {
        clearSavedData()
        toast.success("Inscription réussie !")
        router.push("/tableau-de-bord")
      } else {
        // ✅ CORRECTION: Utiliser setTimeout pour s'assurer que le changement d'étape se fait après la mise à jour de session
        toast.success("Compte créé avec succès ! Continuons votre configuration.")
        setTimeout(() => {
          setCurrentStep(2)
        }, 100) // Petit délai pour éviter les conflits de state
      }
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue lors de la création du compte")
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

  // Gestion du paiement après l'onboarding
  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true)
    
    try {
      const finalData = { ...formData, preferences: data }
      const onboardingData = {
        userId: finalData.userId!,
        role: selectedRole!,
        personalInfo: finalData.personalInfo || {},
        activity: finalData.activity,
        bio: finalData.bio,
        services: finalData.services,
        preferences: finalData.preferences
      }

      const result = await completeOnboarding(onboardingData)
      
      if (result.success) {
        clearSavedData() // Nettoyer les données après succès
        toast.success("Profil créé avec succès !")
        
        // Si professionnel avec plan, rediriger vers paiement
        if (selectedRole === UserRole.PROFESSIONAL && selectedPlan) {
          // Sauvegarder le plan pour le paiement
          localStorage.setItem('serenibook_selected_plan', selectedPlan)
          localStorage.setItem('serenibook_subscription_flow', 'true')
          router.push('/finaliser-abonnement')
        } else {
          // Redirection normale
          router.push("/tableau-de-bord")
        }
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