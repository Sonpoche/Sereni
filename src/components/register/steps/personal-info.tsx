// src/components/register/steps/personal-info.tsx (modification)

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
  FileText
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { geocodeAddress } from "@/lib/utils/geocoding"

// Schéma de validation mis à jour
const personalInfoSchema = z.object({
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
    .max(100, "L'adresse ne peut pas dépasser 100 caractères"),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caractères"),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide"),
  companyName: z
    .string()
    .optional(),
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

  const form = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      companyName: "",
      siret: "",
      website: ""
    }
  });

  // Fonction pour géocoder l'adresse
  const handleSubmitWithGeocoding = async (data: any) => {
    if (!isProfessional) {
      // Si c'est un client, pas besoin de géocodage
      onSubmit(data);
      return;
    }

    setLocalLoading(true);
    
    try {
      // Construire l'adresse complète
      const fullAddress = `${data.address}, ${data.postalCode} ${data.city}, France`;
      
      // Géocoder l'adresse
      const coords = await geocodeAddress(fullAddress);
      
      if (!coords) {
        toast.warning("Impossible de localiser précisément votre adresse sur la carte. Vous pourrez l'ajuster plus tard.");
        // Continuer malgré l'erreur
        onSubmit(data);
        return;
      }
      
      // Ajouter les coordonnées aux données
      const dataWithCoords = {
        ...data,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      
      // Mettre à jour les coordonnées dans la base de données si l'utilisateur est déjà connecté
      if (session?.user?.id) {
        try {
          await fetch(`/api/users/${session.user.id}/coordonnees`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          });
        } catch (error) {
          console.warn("Erreur lors de la mise à jour des coordonnées:", error);
          // Non bloquant, on continue
        }
      }
      
      // Soumettre les données
      onSubmit(dataWithCoords);
    } catch (error) {
      console.error("Erreur lors du géocodage:", error);
      // Continuer malgré l'erreur
      onSubmit(data);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Vos informations personnelles
        </h1>
        <p className="text-gray-500 text-base">
          Ces informations nous permettront de personnaliser votre expérience
        </p>
      </div>

      <ConseilBox className="mb-8">
        Ces informations resteront confidentielles et ne seront utilisées que pour 
        améliorer votre expérience sur SereniBook.
        {isProfessional && (
          <>
            <br />
            <br />
            Votre adresse permettra aux clients de vous trouver lors des recherches par localisation.
          </>
        )}
      </ConseilBox>

      {/* Container principal avec bordure verte */}
      <div className="bg-white border border-primary/20 rounded-xl p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitWithGeocoding)} className="space-y-6">
            {/* Chaque FormItem aura un fond vert très léger */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<User className="h-4 w-4" />}>
                    Nom complet
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jean Dupont"
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
              name="phone"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Phone className="h-4 w-4" />}>
                    Téléphone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="06 12 34 56 78"
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
              name="address"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Home className="h-4 w-4" />}>
                    Adresse
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 rue de la Paix"
                      className="h-11 bg-white"
                      disabled={isLoading || localLoading}
                      {...field}
                    />
                  </FormControl>
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
                    <FormLabel required icon={<Building className="h-4 w-4" />}>
                      Ville
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
                    <FormLabel required icon={<MapPin className="h-4 w-4" />}>
                      Code postal
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

            {isProfessional && (
              <div className="space-y-6 pt-6 border-t border-primary/10">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="bg-primary/5 rounded-lg p-4">
                      <FormLabel icon={<Building2 className="h-4 w-4" />}>
                        Nom de l'entreprise 
                        <span className="text-gray-500 text-sm font-normal ml-1">(facultatif)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ma Société"
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
                  name="siret"
                  render={({ field }) => (
                    <FormItem className="bg-primary/5 rounded-lg p-4">
                      <FormLabel icon={<FileText className="h-4 w-4" />}>
                        Numéro SIRET 
                        <span className="text-gray-500 text-sm font-normal ml-1">(facultatif)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678901234"
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
                  name="website"
                  render={({ field }) => (
                    <FormItem className="bg-primary/5 rounded-lg p-4">
                      <FormLabel icon={<Globe className="h-4 w-4" />}>
                        Site web 
                        <span className="text-gray-500 text-sm font-normal ml-1">(facultatif)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://monsite.com"
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