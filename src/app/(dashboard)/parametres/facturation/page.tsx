// src/app/(dashboard)/parametres/facturation/page.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard, 
  FileText, 
  Settings, 
  Save, 
  CheckCircle,
  AlertCircle,
  Euro,
  Download,
  Upload,
  Building,
  Calculator,
  Printer,
  TrendingUp
} from "lucide-react"

const billingSchema = z.object({
  companyName: z.string().optional(),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "L'adresse est requise"),
    city: z.string().min(1, "La ville est requise"),
    postalCode: z.string().min(1, "Le code postal est requis"),
    country: z.string().default("France")
  }),
  defaultPaymentTerms: z.number().min(1).max(90),
  defaultLateFee: z.number().min(0).max(100),
  currencyCode: z.string().default("EUR"),
  taxRate: z.number().min(0).max(100),
  invoicePrefix: z.string().min(1, "Le préfixe est requis"),
  invoiceFooter: z.string().optional(),
  autoSendInvoices: z.boolean().default(true),
  autoReminders: z.boolean().default(true),
  paymentMethods: z.object({
    cash: z.boolean().default(true),
    card: z.boolean().default(true),
    check: z.boolean().default(false),
    transfer: z.boolean().default(false)
  }),
  bankInfo: z.object({
    bankName: z.string().optional(),
    iban: z.string().optional(),
    bic: z.string().optional(),
    accountHolder: z.string().optional()
  }).optional()
})

type BillingFormData = z.infer<typeof billingSchema>

const mockBillingData: BillingFormData = {
  companyName: "Coaching Évolution SARL",
  siret: "12345678901234",
  tvaNumber: "FR12345678901",
  address: {
    street: "123 Rue de la Sérénité",
    city: "Paris",
    postalCode: "75011",
    country: "France"
  },
  defaultPaymentTerms: 30,
  defaultLateFee: 1.5,
  currencyCode: "EUR",
  taxRate: 20,
  invoicePrefix: "FACT-",
  invoiceFooter: "Merci pour votre confiance. Règlement par virement ou espèces.\nEn cas de retard de paiement, une pénalité de 1,5% par mois sera appliquée.",
  autoSendInvoices: true,
  autoReminders: true,
  paymentMethods: {
    cash: true,
    card: true,
    check: false,
    transfer: true
  },
  bankInfo: {
    bankName: "Crédit Agricole Île-de-France",
    iban: "FR76 1820 6000 7201 2345 6789 012",
    bic: "AGRIFRPP882",
    accountHolder: "Coaching Évolution SARL"
  }
}

const mockStats = {
  monthlyRevenue: 2450,
  sentInvoices: 28,
  overdueInvoices: 3,
  paidInvoices: 25,
  averagePaymentTime: 18
}

export default function FacturationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: mockBillingData
  })

  const onSubmit = async (data: BillingFormData) => {
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      const response = await fetch('/api/user/billing-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewInvoice = () => {
    // Logique pour prévisualiser une facture type
    console.log('Aperçu facture')
  }

  const handleExportReports = (type: 'monthly' | 'annual' | 'accounting') => {
    // Logique d'export selon le type
    console.log(`Export ${type}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Paramètres de facturation
        </h1>
        <p className="text-gray-600 mt-2">
          Configurez vos informations de facturation et vos préférences
        </p>
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Paramètres de facturation mis à jour avec succès !
          </AlertDescription>
        </Alert>
      )}

      {/* Aperçu des statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Vue d'ensemble financière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{mockStats.monthlyRevenue}€</div>
              <div className="text-sm text-gray-600">CA ce mois</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{mockStats.sentInvoices}</div>
              <div className="text-sm text-gray-600">Factures envoyées</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{mockStats.paidInvoices}</div>
              <div className="text-sm text-gray-600">Factures payées</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{mockStats.overdueInvoices}</div>
              <div className="text-sm text-gray-600">En retard</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{mockStats.averagePaymentTime}j</div>
              <div className="text-sm text-gray-600">Délai moyen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Informations légales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Informations légales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                {...form.register("companyName")}
                placeholder="Votre entreprise SARL"
              />
              <p className="text-sm text-gray-600 mt-1">
                Laissez vide si vous exercez en nom propre
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siret">Numéro SIRET</Label>
                <Input
                  id="siret"
                  {...form.register("siret")}
                  placeholder="12345678901234"
                />
                <p className="text-sm text-gray-600 mt-1">
                  14 chiffres sans espaces
                </p>
              </div>
              <div>
                <Label htmlFor="tvaNumber">Numéro de TVA</Label>
                <Input
                  id="tvaNumber"
                  {...form.register("tvaNumber")}
                  placeholder="FR12345678901"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Si vous êtes assujetti à la TVA
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="street">Adresse de facturation</Label>
              <Input
                id="street"
                {...form.register("address.street")}
                placeholder="123 Rue de la Paix"
              />
              {form.formState.errors.address?.street && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.address.street.message}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  {...form.register("address.city")}
                  placeholder="Paris"
                />
                {form.formState.errors.address?.city && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.address.city.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  {...form.register("address.postalCode")}
                  placeholder="75001"
                />
                {form.formState.errors.address?.postalCode && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.address.postalCode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select 
                  value={form.watch("address.country")} 
                  onValueChange={(value) => form.setValue("address.country", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Belgique">Belgique</SelectItem>
                    <SelectItem value="Suisse">Suisse</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres de facturation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Paramètres de facturation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoicePrefix">Préfixe des factures</Label>
                <Input
                  id="invoicePrefix"
                  {...form.register("invoicePrefix")}
                  placeholder="FACT-"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Exemple: FACT-2024-001
                </p>
                {form.formState.errors.invoicePrefix && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.invoicePrefix.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="currencyCode">Devise</Label>
                <Select 
                  value={form.watch("currencyCode")} 
                  onValueChange={(value) => form.setValue("currencyCode", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dollar US ($)</SelectItem>
                    <SelectItem value="CHF">Franc Suisse (CHF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultPaymentTerms">Délai de paiement par défaut (jours)</Label>
                <Select 
                  value={form.watch("defaultPaymentTerms").toString()} 
                  onValueChange={(value) => form.setValue("defaultPaymentTerms", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Payable immédiatement</SelectItem>
                    <SelectItem value="15">15 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="45">45 jours</SelectItem>
                    <SelectItem value="60">60 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                <Select 
                  value={form.watch("taxRate").toString()} 
                  onValueChange={(value) => form.setValue("taxRate", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (exonéré)</SelectItem>
                    <SelectItem value="5.5">5,5% (taux réduit)</SelectItem>
                    <SelectItem value="10">10% (taux intermédiaire)</SelectItem>
                    <SelectItem value="20">20% (taux normal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="defaultLateFee">Pénalités de retard (% par mois)</Label>
                <Input
                  id="defaultLateFee"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...form.register("defaultLateFee", { valueAsNumber: true })}
                  className="max-w-32"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Taux légal en France: 1,5% par mois + indemnité forfaitaire de 40€
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="invoiceFooter">Pied de page des factures</Label>
              <Textarea
                id="invoiceFooter"
                {...form.register("invoiceFooter")}
                placeholder="Informations de paiement, mentions légales..."
                rows={4}
              />
              <p className="text-sm text-gray-600 mt-1">
                Ces informations apparaîtront en bas de chaque facture
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Moyens de paiement acceptés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Moyens de paiement acceptés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Sélectionnez les moyens de paiement que vous acceptez. Ils apparaîtront sur vos factures.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Euro className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label>Espèces</Label>
                    <p className="text-sm text-gray-600">Paiement en liquide</p>
                  </div>
                </div>
                <Switch
                  checked={form.watch("paymentMethods.cash")}
                  onCheckedChange={(checked) => form.setValue("paymentMethods.cash", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label>Carte bancaire</Label>
                    <p className="text-sm text-gray-600">Terminal de paiement</p>
                  </div>
                </div>
                <Switch
                  checked={form.watch("paymentMethods.card")}
                  onCheckedChange={(checked) => form.setValue("paymentMethods.card", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label>Chèque</Label>
                    <p className="text-sm text-gray-600">Paiement par chèque</p>
                  </div>
                </div>
                <Switch
                  checked={form.watch("paymentMethods.check")}
                  onCheckedChange={(checked) => form.setValue("paymentMethods.check", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label>Virement bancaire</Label>
                    <p className="text-sm text-gray-600">Transfert bancaire</p>
                  </div>
                </div>
                <Switch
                  checked={form.watch("paymentMethods.transfer")}
                  onCheckedChange={(checked) => form.setValue("paymentMethods.transfer", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations bancaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Informations bancaires (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Ces informations apparaîtront sur vos factures pour faciliter les virements bancaires.
                Elles ne sont affichées que si vous acceptez les virements.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Nom de la banque</Label>
                <Input
                  id="bankName"
                  {...form.register("bankInfo.bankName")}
                  placeholder="Crédit Agricole Île-de-France"
                />
              </div>
              <div>
                <Label htmlFor="accountHolder">Titulaire du compte</Label>
                <Input
                  id="accountHolder"
                  {...form.register("bankInfo.accountHolder")}
                  placeholder="Nom ou raison sociale"
                />
              </div>
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  {...form.register("bankInfo.iban")}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                />
              </div>
              <div>
                <Label htmlFor="bic">BIC/SWIFT</Label>
                <Input
                  id="bic"
                  {...form.register("bankInfo.bic")}
                  placeholder="AGRIFRPP"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automatisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Automatisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Envoi automatique des factures</Label>
                <p className="text-sm text-gray-600">
                  Envoyer les factures par email automatiquement après le rendez-vous
                </p>
              </div>
              <Switch
                checked={form.watch("autoSendInvoices")}
                onCheckedChange={(checked) => form.setValue("autoSendInvoices", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Rappels automatiques de paiement</Label>
                <p className="text-sm text-gray-600">
                  Envoyer des rappels pour les factures impayées (7, 15 et 30 jours après échéance)
                </p>
              </div>
              <Switch
                checked={form.watch("autoReminders")}
                onCheckedChange={(checked) => form.setValue("autoReminders", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modèles et exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Modèles et exports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Modèles de documents</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modèle de facture</Label>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={handlePreviewInvoice}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Personnaliser
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Modèle de devis</Label>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Personnaliser
                    </Button>
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  La personnalisation avancée des modèles est disponible avec le plan Premium.
                  <a href="/parametres/abonnement" className="ml-2 text-primary hover:underline">
                    Voir les plans
                  </a>
                </AlertDescription>
              </Alert>
            </div>

            <div>
              <h3 className="font-medium mb-3">Rapports financiers</h3>
              <div className="grid md:grid-cols-3 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleExportReports('monthly')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Rapport mensuel
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleExportReports('annual')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Rapport annuel
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleExportReports('accounting')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export comptable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions finales */}
        <div className="flex justify-between items-center">
          <Alert className="flex-1 mr-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les modifications seront appliquées aux prochaines factures générées.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={handlePreviewInvoice}
            >
              <FileText className="h-4 w-4 mr-2" />
              Aperçu facture
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-32">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}