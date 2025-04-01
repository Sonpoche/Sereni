"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ProfessionalType, professionalTypeLabels } from "@/types/professional"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Loader2, 
  Briefcase,
  GraduationCap,
  Lightbulb
} from "lucide-react"

const activitySchema = z.object({
  type: z.nativeEnum(ProfessionalType, {
    required_error: "Veuillez sélectionner votre type d'activité",
  }),
  otherTypeDetails: z.string().optional().refine((val) => {
    if (val === ProfessionalType.AUTRE) {
      return val && val.length > 0;
    }
    return true;
  }, {
    message: "Veuillez préciser votre type d'activité"
  }),
  experience: z.number().min(0, "L'expérience ne peut pas être négative")
});

type ActivityData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  onSubmit: (data: ActivityData) => void;
  onBack: () => void;
  initialData?: Partial<ActivityData>;
  isLoading?: boolean;
}

export default function ActivityForm({
  onSubmit,
  onBack,
  initialData,
  isLoading = false
}: ActivityFormProps) {
  const form = useForm<ActivityData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: initialData?.type || undefined,
      otherTypeDetails: initialData?.otherTypeDetails || "",
      experience: initialData?.experience || 0
    }
  });

  const selectedType = form.watch("type");

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Votre activité
        </h1>
        <p className="text-gray-500 text-base">
          Décrivez votre pratique professionnelle
        </p>
      </div>

      <ConseilBox 
        icon={<Lightbulb className="h-5 w-5 text-lavender" />}
        className="mb-8"
      >
        Ces informations nous permettent d'orienter les clients vers les
        professionnels qui correspondent le mieux à leurs besoins.
      </ConseilBox>

      {/* Container principal avec bordure verte */}
      <div className="bg-white border border-primary/20 rounded-xl p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Briefcase className="h-4 w-4" />}>
                    Type d'activité
                  </FormLabel>
                  <FormDescription>
                    Sélectionnez l'activité qui correspond le mieux à votre pratique
                  </FormDescription>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 bg-white">
                        <SelectValue placeholder="Sélectionnez votre activité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ProfessionalType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {professionalTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === ProfessionalType.AUTRE && (
              <FormField
                control={form.control}
                name="otherTypeDetails"
                render={({ field }) => (
                  <FormItem className="bg-primary/5 rounded-lg p-4">
                    <FormLabel required icon={<Briefcase className="h-4 w-4" />}>
                      Précisez votre activité
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Par exemple: Chiropracteur, Energéticien..."
                        className="h-11 bg-white"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<GraduationCap className="h-4 w-4" />}>
                    Années d'expérience
                  </FormLabel>
                  <FormDescription>
                    Indiquez votre expérience professionnelle dans ce domaine
                  </FormDescription>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      className="h-11 bg-white"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isLoading}
                    />
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