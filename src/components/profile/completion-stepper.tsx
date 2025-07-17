// src/components/profile/completion-stepper.tsx

"use client"

import { UserRole } from "@prisma/client"
import { cn } from "@/lib/utils"
import { 
  Shield, 
  User, 
  Users2, 
  Sparkles, 
  Calendar,
  Clock, 
  Zap,
  CheckCircle
} from "lucide-react"

type StepConfig = {
  id: number;
  title: string;
  description: string;
  icon: any;
  estimatedTime: string;
};

interface CompletionStepperProps {
  userType: UserRole;
  currentStep: number;
}

export default function CompletionStepper({ userType, currentStep }: CompletionStepperProps) {
  // Configuration des étapes selon le type d'utilisateur
  const getSteps = (): StepConfig[] => {
    if (userType === UserRole.CLIENT) {
      return [
        { 
          id: 1, 
          title: "Compte", 
          description: "Sécurisé", 
          icon: Shield,
          estimatedTime: "✓"
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
          title: "Préférences", 
          description: "Finalisation", 
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
          estimatedTime: "✓"
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
          title: "Horaires", 
          description: "Disponibilités", 
          icon: Clock,
          estimatedTime: "2 min"
        },
        { 
          id: 7, 
          title: "Préférences", 
          description: "Finalisation", 
          icon: Zap,
          estimatedTime: "1 min"
        }
      ]
    }
  }

  const steps = getSteps()
  // Ajuster le currentStep pour inclure l'étape "Compte" déjà complétée
  const adjustedCurrentStep = currentStep + 1
  const progressPercentage = (adjustedCurrentStep / steps.length) * 100

  return (
    <div className="relative mb-20 max-w-4xl mx-auto">
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
          const isActive = step.id === adjustedCurrentStep
          const isCompleted = step.id < adjustedCurrentStep
          const isUpcoming = step.id > adjustedCurrentStep
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
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <StepIcon className="w-6 h-6" />
                )}
              </div>

              {/* Titre et description */}
              <div className="mt-4 text-center">
                <div
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive && "text-primary",
                    isCompleted && "text-gray-900",
                    isUpcoming && "text-gray-400"
                  )}
                >
                  {step.title}
                </div>
                <div
                  className={cn(
                    "text-xs mt-1 transition-colors",
                    isActive && "text-primary/70",
                    isCompleted && "text-gray-500",
                    isUpcoming && "text-gray-400"
                  )}
                >
                  {step.description}
                </div>
                <div
                  className={cn(
                    "text-xs mt-1 transition-colors",
                    isActive && "text-primary/50",
                    "text-gray-400"
                  )}
                >
                  {step.estimatedTime}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}