// src/components/register/form-navigation.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface FormNavigationProps {
  onBack?: () => void;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export function FormNavigation({ 
  onBack, 
  isLastStep = false,
  isLoading = false 
}: FormNavigationProps) {
  return (
    <div className="flex justify-between gap-4 pt-8">
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          Précédent
        </Button>
      ) : (
        <div /> // Espace vide pour garder l'alignement
      )}

      <Button 
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isLastStep ? "Finalisation..." : "Enregistrement..."}
          </>
        ) : (
          isLastStep ? "Terminer l'inscription" : "Suivant"
        )}
      </Button>
    </div>
  );
}