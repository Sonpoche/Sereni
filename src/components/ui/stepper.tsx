// src/components/register/stepper.tsx
import { UserRole } from "@prisma/client"
import { cn } from "@/lib/utils"

type StepConfig = {
  id: number;
  title: string;
  subtitle: string;
};

const clientSteps: StepConfig[] = [
  {
    id: 1,
    title: "Informations personnelles",
    subtitle: "Renseignez vos coordonnées"
  },
  {
    id: 2,
    title: "Préférences",
    subtitle: "Configurez votre compte"
  }
];

const professionalSteps: StepConfig[] = [
  {
    id: 1,
    title: "Informations personnelles",
    subtitle: "Renseignez vos coordonnées"
  },
  {
    id: 2,
    title: "Activité",
    subtitle: "Décrivez votre activité"
  },
  {
    id: 3,
    title: "Présentation",
    subtitle: "Parlez de vous et de votre approche"
  },
  {
    id: 4,
    title: "Préférences",
    subtitle: "Configurez votre compte"
  }
];

interface StepperProps {
  userType: UserRole;
  currentStep: number;
}

export default function Stepper({ userType, currentStep }: StepperProps) {
  const steps = userType === UserRole.CLIENT ? clientSteps : professionalSteps;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      <nav aria-label="Progress">
        {/* Version mobile - Uniquement l'étape en cours */}
        <div className="lg:hidden">
          {steps.map((step) => {
            if (step.id === currentStep) {
              return (
                <div key={step.id} className="text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                      {step.id}
                    </div>
                  </div>
                  <h4 className="font-medium text-primary">{step.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{step.subtitle}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    Étape {currentStep} sur {steps.length}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Version desktop - Toutes les étapes */}
        <ol className="relative z-10 hidden lg:flex justify-between">
          {/* Barre de progression en arrière-plan */}
          <div
            className="absolute top-5 left-0 w-full h-[1px] bg-gray-200"
            style={{
              left: '50px',
              width: 'calc(100% - 100px)',
            }}
          >
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Points d'étape */}
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <li 
                key={step.id} 
                className={cn(
                  "flex flex-col items-center",
                  isActive && "opacity-100",
                  !isActive && !isCompleted && "opacity-70"
                )}
              >
                {/* Numéro d'étape */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-white transition-colors",
                      isCompleted ? "border-primary bg-primary text-white" : 
                      isActive ? "border-primary text-primary" :
                      "border-gray-300 text-gray-500"
                    )}
                  >
                    {step.id}
                  </div>
                </div>

                {/* Textes en dessous */}
                <div className="mt-4 text-center min-w-[120px]">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-primary" : "text-gray-900"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {step.subtitle}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}