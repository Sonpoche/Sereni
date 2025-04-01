// src/components/profile/personal-info-tab.tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Mail, Phone, User, Building2, FileText, Globe } from "lucide-react"

// Interface pour les données du profil
interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  professionalProfile?: {
    id?: string;
    phone?: string;
    companyName?: string;
    siret?: string;
    website?: string;
  };
  clientProfile?: {
    id?: string;
    phone?: string;
  };
}

// Type pour la fonction setProfileData
type SetProfileDataFunction = (data: ProfileData | ((prevData: ProfileData) => ProfileData)) => void;

// Interface pour les props du composant
interface PersonalInfoTabProps {
  profileData: ProfileData;
  setProfileData: SetProfileDataFunction;
}

const personalInfoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide").optional(),
  phone: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Numéro de téléphone invalide"),
  companyName: z.string().optional(),
  siret: z.string().regex(/^\d{14}$/, "Numéro SIRET invalide").optional().or(z.literal('')),
  website: z.string().url("URL du site web invalide").optional().or(z.literal(''))
})

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>

export default function PersonalInfoTab({ profileData, setProfileData }: PersonalInfoTabProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Préparer les valeurs par défaut du formulaire
  const defaultValues: Partial<PersonalInfoFormValues> = {
    name: profileData?.name || "",
    email: profileData?.email || "",
    phone: profileData?.professionalProfile?.phone || profileData?.clientProfile?.phone || "",
    companyName: profileData?.professionalProfile?.companyName || "",
    siret: profileData?.professionalProfile?.siret || "",
    website: profileData?.professionalProfile?.website || ""
  }

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues,
  })

  async function onSubmit(data: PersonalInfoFormValues) {
    setIsSubmitting(true)
    
    try {
      // Mettre à jour les informations personnelles
      const response = await fetch(`/api/users/${session?.user?.id}/personal-info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des informations")
      }

      const updatedInfo = await response.json()
      
      // Mettre à jour les données du profil dans l'état local
      setProfileData((prevData: ProfileData) => ({
        ...prevData,
        name: updatedInfo.name,
        // Autres mises à jour selon la structure retournée par l'API
        professionalProfile: {
          ...prevData.professionalProfile,
          phone: updatedInfo.phone,
          companyName: updatedInfo.companyName,
          siret: updatedInfo.siret,
          website: updatedInfo.website
        }
      }))

      toast.success("Informations personnelles mises à jour avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour des informations")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-6">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <User className="h-5 w-5" />
          Informations personnelles
        </CardTitle>
        <CardDescription>
          Mettez à jour vos informations de contact et vos coordonnées professionnelles
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom complet */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                      <User className="h-4 w-4 text-primary/60" />
                      Nom complet
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Jean Dupont" 
                        {...field} 
                        className="h-11 border-gray-200 focus:border-primary/40 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email (lecture seule) */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                      <Mail className="h-4 w-4 text-primary/60" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="vous@exemple.com" 
                        {...field} 
                        disabled 
                        readOnly
                        className="h-11 bg-gray-50 text-gray-500"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 mt-1 italic">
                      L'adresse email ne peut pas être modifiée. Contactez le support pour tout changement.
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Téléphone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                      <Phone className="h-4 w-4 text-primary/60" />
                      Téléphone
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="06 12 34 56 78" 
                        {...field} 
                        className="h-11 border-gray-200 focus:border-primary/40 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champs spécifiques pour les professionnels */}
              {session?.user?.role === "PROFESSIONAL" && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <Building2 className="h-4 w-4 text-primary/60" />
                          Nom de l'entreprise <span className="text-gray-400 text-xs font-normal">(facultatif)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Votre entreprise" 
                            {...field} 
                            className="h-11 border-gray-200 focus:border-primary/40 focus:ring-primary/20"
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
                      <FormItem className="col-span-2 md:col-span-1">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <FileText className="h-4 w-4 text-primary/60" />
                          Numéro SIRET <span className="text-gray-400 text-xs font-normal">(facultatif)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345678901234" 
                            {...field} 
                            className="h-11 border-gray-200 focus:border-primary/40 focus:ring-primary/20"
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
                      <FormItem className="col-span-2 md:col-span-1">
                        <FormLabel className="flex items-center gap-2 font-medium text-gray-700">
                          <Globe className="h-4 w-4 text-primary/60" />
                          Site web <span className="text-gray-400 text-xs font-normal">(facultatif)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://votresite.com" 
                            {...field} 
                            className="h-11 border-gray-200 focus:border-primary/40 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Bouton de soumission */}
            <CardFooter className="px-0 pt-4 border-t flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 h-11 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}