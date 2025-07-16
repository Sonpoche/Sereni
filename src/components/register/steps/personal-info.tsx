// src/components/register/steps/personal-info.tsx

"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConseilBox } from "@/components/ui/conseil-box"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { 
  Loader2, 
  User, 
  Phone, 
  Home, 
  Building, 
  MapPin,
  Building2,
  Globe,
  FileText,
  Briefcase,
  MapPinned
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { toast } from "sonner"
import { geocodeForOnboarding } from "@/lib/utils/geocoding"

// Schémas différents selon le type d'utilisateur
const clientInfoSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      "Numéro de téléphone invalide"
    ),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(100, "L'adresse ne peut pas dépasser 100 caractères")
    .optional(),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide")
    .optional(),
});

const professionalInfoSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      "Numéro de téléphone professionnel invalide"
    ),
  // Informations du cabinet/lieu de pratique
  cabinetName: z
    .string()
    .min(2, "Le nom du cabinet est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  address: z
    .string()
    .min(5, "L'adresse du cabinet doit contenir au moins 5 caractères")
    .max(100, "L'adresse ne peut pas dépasser 100 caractères"),
  city: z
    .string()
    .min(2, "La ville est requise"),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide"),
  // Informations légales optionnelles
  siret: z
    .string()
    .regex(/^\d{14}$/, "Numéro SIRET invalide")
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url("URL du site web invalide")
    .optional()
    .or(z.literal(''))
});

interface PersonalInfoFormProps {
  userType: UserRole;
  onSubmit: (data: any) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function PersonalInfoForm({ 
  userType, 
  onSubmit, 
  onBack,
  isLoading = false 
}: PersonalInfoFormProps) {
  const { data: session } = useSession();
  const [localLoading, setLocalLoading] = useState(false);
  const isProfessional = userType === UserRole.PROFESSIONAL;

  // Utiliser le bon schéma selon le type d'utilisateur
  const schema = isProfessional ? professionalInfoSchema : clientInfoSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isProfessional ? {
      name: "",
      phone: "",
      cabinetName: "",
      address: "",
      city: "",
      postalCode: "",
      siret: "",
      website: ""
    } : {
      name: "",
      phone: "",
      address: "",
      city: "",
      postalCode: ""
    }
  });

  // Fonction de géocodage pour les professionnels uniquement
  const handleSubmitWithGeocoding = async (data: any) => {
    if (!isProfessional) {
      // Clients : pas de géocodage nécessaire
      onSubmit(data);
      return;
    }

    // Professionnels : géocodage obligatoire du cabinet
    if (!data.address || !data.city || !data.postalCode) {
      toast.error("Adresse, ville et code postal du cabinet sont requis");
      return;
    }

    setLocalLoading(true);
    
    try {
      console.log('🔍 Géocodage cabinet pour:', data);
      
      const coords = await geocodeForOnboarding({
        address: data.address,
        city: data.city,
        postalCode: data.postalCode
      });
      
      if (!coords) {
        console.log('❌ Échec géocodage cabinet');
        
        toast.error("Impossible de localiser votre cabinet", {
          description: "Vérifiez l'adresse de votre cabinet. Une localisation précise aide vos clients à vous trouver.",
          duration: 6000,
          action: {
            label: "Continuer quand même",
            onClick: () => {
              toast.info("Vous pourrez préciser la localisation de votre cabinet depuis votre profil");
              onSubmit(data);
            }
          }
        });
        
        return;
      }
      
      console.log('✅ Cabinet géolocalisé:', coords);
      
      toast.success("Cabinet localisé avec succès !", {
        description: `Vos clients pourront facilement vous trouver`,
        duration: 3000
      });
      
      const dataWithCoords = {
        ...data,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      
      onSubmit(dataWithCoords);
      
    } catch (error) {
      console.error("Erreur géocodage:", error);
      
      toast.error("Erreur technique de géolocalisation", {
        description: "Problème technique. Voulez-vous continuer sans localisation ?",
        duration: 5000,
        action: {
          label: "Continuer",
          onClick: () => {
            toast.info("Vous pourrez configurer la localisation depuis votre profil");
            onSubmit(data);
          }
        }
      });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          {isProfessional ? "Informations professionnelles" : "Vos informations personnelles"}
        </h1>
        <p className="text-gray-500 text-base">
          {isProfessional 
            ? "Renseignez les informations de votre cabinet et votre pratique"
            : "Ces informations nous permettront de personnaliser votre expérience"
          }
        </p>
      </div>

      <ConseilBox className="mb-8">
        {isProfessional ? (
          <>
            <strong>Cabinet médical :</strong> Ces informations concernent votre lieu de pratique professionnel. 
            Elles seront visibles par vos clients pour qu'ils puissent vous localiser et vous contacter.
            <br /><br />
            <strong>Géolocalisation :</strong> L'adresse de votre cabinet sera automatiquement géolocalisée 
            pour apparaître dans les recherches de proximité.
          </>
        ) : (
          <>
            Ces informations resteront confidentielles et ne seront utilisées que pour 
            améliorer votre expérience sur SereniBook.
          </>
        )}
      </ConseilBox>

      <div className="bg-white border border-primary/20 rounded-xl p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitWithGeocoding)} className="space-y-6">
            
            {/* Nom (identique pour tous) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<User className="h-4 w-4" />}>
                    {isProfessional ? "Nom du praticien" : "Nom complet"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={isProfessional ? "Dr. Jean Dupont" : "Jean Dupont"}
                      className="h-11 bg-white"
                      disabled={isLoading || localLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Téléphone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Phone className="h-4 w-4" />}>
                    {isProfessional ? "Téléphone du cabinet" : "Téléphone"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="01 23 45 67 89"
                      className="h-11 bg-white"
                      disabled={isLoading || localLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    {isProfessional && "Numéro que vos clients utiliseront pour vous joindre"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom du cabinet (professionnels seulement) */}
            {isProfessional && (
              <FormField
                control={form.control}
                name="cabinetName"
                render={({ field }) => (
                  <FormItem className="bg-primary/5 rounded-lg p-4">
                    <FormLabel required icon={<Briefcase className="h-4 w-4" />}>
                      Nom du cabinet
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cabinet de bien-être Dr. Dupont"
                        className="h-11 bg-white"
                        disabled={isLoading || localLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Nom affiché pour vos clients (ex: "Cabinet Dr. Martin", "Espace Zen")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Adresse */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required={isProfessional} icon={isProfessional ? <MapPinned className="h-4 w-4" /> : <Home className="h-4 w-4" />}>
                    {isProfessional ? "Adresse du cabinet" : "Adresse"}
                    {!isProfessional && <span className="text-gray-500 text-sm font-normal ml-1">(facultatif)</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isProfessional ? "123 avenue de la Santé" : "123 rue de la Paix"}
                      className="h-11 bg-white"
                      disabled={isLoading || localLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    {isProfessional && "Adresse où vos clients viendront vous consulter"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="bg-primary/5 rounded-lg p-4">
                    <FormLabel required={isProfessional} icon={<Building className="h-4 w-4" />}>
                      Ville
                      {!isProfessional && <span className="text-gray-500 text-sm font-normal ml-1">(facultatif)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Paris"
                        className="h-11 bg-white"
                        disabled={isLoading || localLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem className="bg-primary/5 rounded-lg p-4">
                    <FormLabel required={isProfessional} icon={<MapPin className="h-4 w-4" />}>
                      Code postal
                      {!isProfessional && <span className="text-gray-500 text-sm font-normal ml-1">(facultatif)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="75001"
                        className="h-11 bg-white"
                        disabled={isLoading || localLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informations légales (professionnels seulement) */}
            {isProfessional && (
              <div className="space-y-6 pt-6 border-t border-primary/10">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informations légales <span className="text-sm font-normal text-gray-500">(facultatif)</span>
                </h3>

                <FormField
                  control={form.control}
                  name="siret"
                  render={({ field }) => (
                    <FormItem className="bg-primary/5 rounded-lg p-4">
                      <FormLabel icon={<FileText className="h-4 w-4" />}>
                        Numéro SIRET
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678901234"
                          className="h-11 bg-white"
                          disabled={isLoading || localLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Pour la facturation et les mentions légales
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="bg-primary/5 rounded-lg p-4">
                      <FormLabel icon={<Globe className="h-4 w-4" />}>
                        Site web
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://mon-cabinet.com"
                          className="h-11 bg-white"
                          disabled={isLoading || localLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Lien vers votre site web professionnel
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading || localLoading}
              >
                Retour
              </Button>
              <Button 
                type="submit"
                disabled={isLoading || localLoading}
              >
                {isLoading || localLoading ? (
                  <>
                    <Loader2 className="w-4 w-4 mr-2 animate-spin" />
                    {localLoading ? "Localisation du cabinet..." : "Enregistrement..."}
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