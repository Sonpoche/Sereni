// src/components/profile/client-view.tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Phone, User, MapPin, Building, Home } from "lucide-react"

// Définition d'une interface pour typifier profileData
interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  clientProfile?: {
    id?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

const clientProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Numéro de téléphone invalide"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
})

type ClientProfileFormValues = z.infer<typeof clientProfileSchema>

export default function ClientView({ profileData }: { profileData: ProfileData }) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Préparer les valeurs par défaut du formulaire
  const defaultValues: Partial<ClientProfileFormValues> = {
    name: profileData?.name || "",
    phone: profileData?.clientProfile?.phone || "",
    address: profileData?.clientProfile?.address || "",
    city: profileData?.clientProfile?.city || "",
    postalCode: profileData?.clientProfile?.postalCode || "",
  }

  const form = useForm<ClientProfileFormValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues,
  })

  async function onSubmit(data: ClientProfileFormValues) {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/client-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du profil")
      }

      toast.success("Profil mis à jour avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-title font-medium mb-8">Mon profil</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Mes informations personnelles</CardTitle>
          <CardDescription>
            Mettez à jour vos informations de contact et vos coordonnées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nom complet */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary/60" />
                      Nom complet
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email (lecture seule) */}
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary/60" />
                  Email
                </FormLabel>
                <Input 
                  value={profileData?.email || ""}
                  placeholder="vous@exemple.com" 
                  disabled 
                  readOnly
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'adresse email ne peut pas être modifiée.
                </p>
              </FormItem>

              {/* Téléphone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary/60" />
                      Téléphone
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="06 12 34 56 78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adresse */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary/60" />
                      Adresse
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123 rue de la Paix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ville et code postal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary/60" />
                        Ville
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary/60" />
                        Code postal
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="75001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bouton de soumission */}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}