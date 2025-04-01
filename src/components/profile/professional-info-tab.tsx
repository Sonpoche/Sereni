// src/components/profile/professional-info-tab.tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ProfessionalType, professionalTypeLabels } from "@/types/professional"
import { 
  Loader2, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Building, 
  FileText, 
  Home, 
  Tag,
  Award,
  Save,
  User,
  Globe
} from "lucide-react"

// Interface pour la forme des données de profil professionnel
interface ProfessionalProfileData {
  id?: string;
  name?: string;
  email?: string;
  professionalProfile?: {
    id?: string;
    type?: string;
    otherTypeDetails?: string;
    yearsExperience?: number;
    bio?: string;
    description?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    specialties?: string[];
    certifications?: string[];
  };
}

// Type pour la fonction setProfileData
type SetProfileDataFunction = (data: ProfessionalProfileData | ((prevData: ProfessionalProfileData) => ProfessionalProfileData)) => void;

// Interface pour les props du composant
interface ProfessionalInfoTabProps {
  profileData: ProfessionalProfileData;
  setProfileData: SetProfileDataFunction;
}

const professionalInfoSchema = z.object({
  type: z.string().min(1, "Le type d'activité est requis"),
  otherTypeDetails: z.string().optional(),
  yearsExperience: z.number().min(0, "Les années d'expérience ne peuvent pas être négatives"),
  bio: z.string().min(100, "La biographie doit contenir au moins 100 caractères").max(500, "La biographie ne doit pas dépasser 500 caractères"),
  approach: z.string().min(100, "L'approche doit contenir au moins 100 caractères").max(500, "L'approche ne doit pas dépasser 500 caractères"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  specialties: z.string().optional(),
  certifications: z.string().optional(),
})

type ProfessionalInfoFormValues = z.infer<typeof professionalInfoSchema>

export default function ProfessionalInfoTab({ profileData, setProfileData }: ProfessionalInfoTabProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Préparer les valeurs par défaut du formulaire
  const defaultValues: Partial<ProfessionalInfoFormValues> = {
    type: profileData?.professionalProfile?.type || "",
    otherTypeDetails: profileData?.professionalProfile?.otherTypeDetails || "",
    yearsExperience: profileData?.professionalProfile?.yearsExperience || 0,
    bio: profileData?.professionalProfile?.bio || "",
    approach: profileData?.professionalProfile?.description || "",
    address: profileData?.professionalProfile?.address || "",
    city: profileData?.professionalProfile?.city || "",
    postalCode: profileData?.professionalProfile?.postalCode || "",
    specialties: profileData?.professionalProfile?.specialties?.join(", ") || "",
    certifications: profileData?.professionalProfile?.certifications?.join(", ") || "",
  }

  const form = useForm<ProfessionalInfoFormValues>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues,
  })

  // Surveiller le type d'activité pour afficher le champ "Autre" si nécessaire
  const watchType = form.watch("type")
  // Surveiller le contenu des champs avec limite de caractères
  const bioValue = form.watch("bio") || "";
  const approachValue = form.watch("approach") || "";

  async function onSubmit(data: ProfessionalInfoFormValues) {
    setIsSubmitting(true)
    
    try {
      console.log("Envoi des données:", data);
      
      // Transformer les chaînes en tableaux pour specialties et certifications
      const specialtiesArray = data.specialties 
        ? data.specialties.split(",").map(item => item.trim()).filter(Boolean)
        : []
        
      const certificationsArray = data.certifications
        ? data.certifications.split(",").map(item => item.trim()).filter(Boolean)
        : []
      
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("ID utilisateur non disponible");
      }
      
      const apiUrl = `/api/users/${userId}/professional-profile`;
      console.log("Appel API à:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          specialties: specialtiesArray,
          certifications: certificationsArray,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Réponse API erreur:", response.status, errorData);
        throw new Error(`Erreur HTTP ${response.status}: ${errorData.error || "Erreur inconnue"}`);
      }

      const updatedProfile = await response.json()
      setProfileData((prevData) => ({
        ...prevData,
        professionalProfile: updatedProfile,
      }))

      toast.success("Profil professionnel mis à jour avec succès")
    } catch (error) {
      console.error("Erreur complète:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-primary text-lg font-medium">Informations professionnelles</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1 ml-7">
          Ces informations aideront vos clients potentiels à mieux vous connaître et à comprendre votre activité
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Type d'activité et années d'expérience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <Briefcase className="h-5 w-5 text-primary mr-2" />
                    <span className="text-gray-800 font-medium">Type d'activité</span>
                  </div>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-12 border-gray-200">
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProfessionalType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {professionalTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearsExperience"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <GraduationCap className="h-5 w-5 text-primary mr-2" />
                    <span className="text-gray-800 font-medium">Années d'expérience</span>
                  </div>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      className="h-12 border-gray-200" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Autre type d'activité si sélectionné */}
          {watchType === ProfessionalType.AUTRE && (
            <FormField
              control={form.control}
              name="otherTypeDetails"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-primary mr-2" />
                    <span className="text-gray-800 font-medium">Précisez votre activité</span>
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="Par exemple: Chiropracteur, Énergéticien..." 
                      className="h-12 border-gray-200"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Adresse professionnelle */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-primary text-lg font-medium">Adresse professionnelle</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Adresse */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <Home className="h-5 w-5 text-primary mr-2" />
                    <span className="text-gray-800 font-medium">Adresse</span>
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="123 rue de la Paix" 
                      className="h-12 border-gray-200"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ville */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <Building className="h-5 w-5 text-primary mr-2" />
                      <span className="text-gray-800 font-medium">Ville</span>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="Paris" 
                        className="h-12 border-gray-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Code postal */}
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 text-primary mr-2" />
                      <span className="text-gray-800 font-medium">Code postal</span>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="75001" 
                        className="h-12 border-gray-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Votre parcours */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="text-primary text-lg font-medium">Votre parcours</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 ml-7">
                  Présentez votre parcours, vos formations et ce qui vous a mené à cette pratique
                </p>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Je suis passionné(e) par le bien-être depuis..." 
                      className="min-h-[150px] resize-none border-gray-200" 
                      {...field} 
                    />
                    <div className="text-right text-xs text-gray-500">
                      {bioValue.length}/500 caractères
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Votre approche */}
          <FormField
            control={form.control}
            name="approach"
            render={({ field }) => (
              <FormItem className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-primary text-lg font-medium">Votre approche</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 ml-7">
                  Décrivez votre méthode, votre philosophie et ce qui rend votre approche unique
                </p>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Mon approche se caractérise par..." 
                      className="min-h-[150px] resize-none border-gray-200" 
                      {...field} 
                    />
                    <div className="text-right text-xs text-gray-500">
                      {approachValue.length}/500 caractères
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Spécialités et certifications - Tout dans un seul container lavande */}
          <div className="bg-lavender-light/70 rounded-lg p-4 border border-lavender/20 space-y-8">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-lavender-dark" />
              <h2 className="text-lavender-dark text-lg font-medium">Spécialités et certifications</h2>
            </div>

            {/* Spécialités */}
            <div>
              <div className="flex items-center mb-2">
                <Tag className="h-5 w-5 text-lavender-dark mr-2" />
                <span className="text-gray-800 font-medium">Spécialités</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Listez vos domaines d'expertise séparés par des virgules
              </p>
              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Stress, Sommeil, Anxiété, Développement personnel..." 
                        className="h-12 border-lavender/30 bg-white/80"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Certifications et diplômes */}
            <div>
              <div className="flex items-center mb-2">
                <Award className="h-5 w-5 text-lavender-dark mr-2" />
                <span className="text-gray-800 font-medium">Certifications et diplômes</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Mentionnez vos formations, certifications et diplômes séparés par des virgules
              </p>
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Diplôme de yoga, Formation en sophrologie..." 
                        className="h-12 border-lavender/30 bg-white/80"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end mt-8">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 h-12 px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}