// src/app/(dashboard)/parametres/facturation/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  Building2, 
  CreditCard, 
  FileText, 
  Save,
  Upload,
  Eye,
  AlertCircle
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Schema de validation
const invoiceSettingsSchema = z.object({
  businessName: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  logoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
})

type InvoiceSettingsData = z.infer<typeof invoiceSettingsSchema>

interface InvoiceSettings {
  id: string | null
  businessName?: string | null
  address?: string | null
  taxNumber?: string | null
  iban?: string | null
  swift?: string | null
  paymentTerms?: string | null
  notes?: string | null
  logoUrl?: string | null
  nextInvoiceNumber: number
}

export default function ParametresFacturationPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)

  // Configuration du formulaire
  const form = useForm<InvoiceSettingsData>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      businessName: "",
      address: "",
      taxNumber: "",
      iban: "",
      swift: "",
      paymentTerms: "Paiement à 30 jours",
      notes: "",
      logoUrl: "",
    }
  })

  // Charger les paramètres existants
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/invoice-settings`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          
          // Remplir le formulaire avec les données existantes
          form.reset({
            businessName: data.businessName || "",
            address: data.address || "",
            taxNumber: data.taxNumber || "",
            iban: data.iban || "",
            swift: data.swift || "",
            paymentTerms: data.paymentTerms || "Paiement à 30 jours",
            notes: data.notes || "",
            logoUrl: data.logoUrl || "",
          })
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error)
        toast.error("Erreur lors du chargement des paramètres")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [session?.user?.id, form])

  // Sauvegarder les paramètres
  const onSubmit = async (data: InvoiceSettingsData) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      
      const response = await fetch(`/api/users/${session.user.id}/invoice-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        toast.success("Paramètres sauvegardés avec succès")
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  // Prévisualiser les paramètres (pour demo)
  const handlePreview = () => {
    toast.info("Fonctionnalité de prévisualisation en cours de développement")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Paramètres de facturation
        </h1>
        <p className="text-gray-600 mt-1">
          Configurez les informations qui apparaîtront sur vos factures
        </p>
      </div>

      {/* Informations importantes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ces informations apparaîtront sur toutes vos factures PDF. 
          Assurez-vous qu'elles sont exactes et à jour.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations de l'entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Mon Cabinet de bien-être"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Le nom qui apparaîtra en en-tête de vos factures
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Rue de la Paix&#10;75001 Paris&#10;France"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Adresse complète avec code postal et ville
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de TVA</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="FR12345678901"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Numéro de TVA intracommunautaire (optionnel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (URL)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://monsite.com/logo.png"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL de votre logo (format PNG ou JPG recommandé)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Informations bancaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informations bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Numéro IBAN de votre compte bancaire professionnel
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="swift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code BIC/SWIFT</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="BNPAFRPPXXX"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Code BIC/SWIFT de votre banque (optionnel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Conditions et notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conditions et notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de paiement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paiement à 30 jours par virement bancaire.&#10;Aucun escompte consenti pour paiement anticipé."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Conditions de paiement par défaut pour toutes vos factures
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes par défaut</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Merci pour votre confiance !&#10;N'hésitez pas à me contacter pour toute question."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Notes qui apparaîtront par défaut sur vos factures
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Informations de numérotation */}
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Numérotation des factures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Prochaine facture :
                  </p>
                  <p className="font-mono text-lg font-bold">
                    FAC-{new Date().getFullYear()}-{settings.nextInvoiceNumber.toString().padStart(4, '0')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    La numérotation est automatique et séquentielle
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Prévisualiser
            </Button>

            <Button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}