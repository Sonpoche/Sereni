// src/components/register/steps/bio-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { ConseilBox } from "@/components/ui/conseil-box"
import { Textarea } from "@/components/ui/textarea"
import { 
  Loader2, 
  FileText,
  Lightbulb,
  HeartHandshake
} from "lucide-react"

const bioSchema = z.object({
  bio: z
    .string()
    .min(100, "Votre bio doit contenir au moins 100 caractères")
    .max(500, "Votre bio ne peut pas dépasser 500 caractères"),
  approach: z
    .string()
    .min(100, "Votre approche doit contenir au moins 100 caractères")
    .max(500, "Votre approche ne peut pas dépasser 500 caractères"),
});

interface BioFormData {
  bio: string;
  approach: string;
}

interface BioFormProps {
  onSubmit: (data: BioFormData) => void;
  onBack: () => void;
  initialData?: Partial<BioFormData>;
  isLoading?: boolean;
}

export default function BioForm({ 
  onSubmit,
  onBack,
  initialData,
  isLoading = false 
}: BioFormProps) {
  const form = useForm<BioFormData>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      bio: initialData?.bio || "",
      approach: initialData?.approach || ""
    }
  });

  // Fonction pour afficher le compteur de caractères
  const countCharacters = (text: string) => {
    return `${text.length}/500 caractères`;
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Votre présentation
        </h1>
        <p className="text-gray-500 text-base">
          Faites-vous connaître auprès de vos futurs clients
        </p>
      </div>

      <ConseilBox 
        icon={<Lightbulb className="h-5 w-5 text-lavender" />}
        className="mb-8"
      >
        Une présentation complète et personnelle augmente significativement
        la confiance de vos futurs clients. Soyez authentique et partagez
        votre passion !
      </ConseilBox>

      <div className="bg-white border border-primary/20 rounded-xl p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<FileText className="h-4 w-4" />}>
                    Votre parcours
                  </FormLabel>
                  <FormDescription>
                    Présentez votre parcours, vos formations et vos certifications.
                    Parlez de ce qui vous a mené à cette pratique.
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Je suis passionné(e) par le bien-être depuis..."
                        className="min-h-[150px] bg-white resize-none"
                        disabled={isLoading}
                        {...field}
                      />
                      <div className="text-right text-sm text-gray-500">
                        {countCharacters(field.value)}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approach"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<HeartHandshake className="h-4 w-4" />}>
                    Votre approche
                  </FormLabel>
                  <FormDescription>
                    Décrivez votre méthode, votre philosophie et ce qui rend
                    votre approche unique. Comment accompagnez-vous vos clients ?
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Mon approche se caractérise par..."
                        className="min-h-[150px] bg-white resize-none"
                        disabled={isLoading}
                        {...field}
                      />
                      <div className="text-right text-sm text-gray-500">
                        {countCharacters(field.value)}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}