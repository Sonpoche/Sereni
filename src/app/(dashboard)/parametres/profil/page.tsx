// src/app/(dashboard)/parametres/profil/page.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react"

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  profession: z.string().min(2, "La profession est requise"),
  specialties: z.array(z.string()).optional(),
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères").optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default("France")
  }).optional(),
  businessInfo: z.object({
    businessName: z.string().optional(),
    siret: z.string().optional(),
    tva: z.string().optional()
  }).optional(),
  notifications: z.object({
    emailAppointments: z.boolean().default(true),
    emailReminders: z.boolean().default(true),
    emailMarketing: z.boolean().default(false),
    smsReminders: z.boolean().default(false)
  })
})

type ProfileFormData = z.infer<typeof profileSchema>

const specialtiesList = [
  "Massage relaxant",
  "Massage thérapeutique", 
  "Réflexologie",
  "Aromathérapie",
  "Coaching de vie",
  "Coaching professionnel",
  "PNL",
  "Hypnose",
  "Naturopathie",
  "Phytothérapie",
  "Nutrition",
  "Yoga",
  "Pilates",
  "Méditation",
  "Sophrologie",
  "Reiki",
  "Magnétisme",
  "Ostéopathie",
  "Kinésiologie",
  "Art-thérapie"
]

// Données mockées - en réalité récupérées depuis l'API
const mockUserData: ProfileFormData = {
  firstName: "Marie",
  lastName: "Dubois",
  email: "marie.dubois@email.com",
  phone: "06 12 34 56 78",
  profession: "Coach en développement personnel",
  specialties: ["Coaching de vie", "PNL", "Méditation"],
  bio: "Accompagne les personnes dans leur développement personnel depuis 8 ans. Spécialisée en PNL et techniques de méditation.",
  address: {
    street: "123 Rue de la Sérénité",
    city: "Paris",
    postalCode: "75011",
    country: "France"
  },
  businessInfo: {
    businessName: "Coaching Évolution",
    siret: "12345678901234",
    tva: "FR12345678901"
  },
  notifications: {
    emailAppointments: true,
    emailReminders: true,
    emailMarketing: false,
    smsReminders: true
  }
}

export default function ProfilPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    mockUserData.specialties || []
  )

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: mockUserData
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      // Ajouter les spécialités sélectionnées
      data.specialties = selectedSpecialties

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Paramètres du profil
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez vos informations personnelles et professionnelles
        </p>
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Profil mis à jour avec succès !
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Photo de profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Photo de profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-lavender-light/20 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-primary/60" />
              </div>
              <div className="space-y-2">
                <Button variant="outline" type="button">
                  Changer la photo
                </Button>
                <p className="text-sm text-gray-600">
                  JPG, PNG ou GIF. Maximum 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations professionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                {...form.register("profession")}
                placeholder="Coach, Massothérapeute, Naturopathe..."
              />
              {form.formState.errors.profession && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.profession.message}
                </p>
              )}
            </div>

            <div>
              <Label>Spécialités</Label>
              <p className="text-sm text-gray-600 mb-3">
                Sélectionnez vos domaines d'expertise
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialtiesList.map((specialty) => (
                  <label
                    key={specialty}
                    className={`
                      flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors
                      ${selectedSpecialties.includes(specialty)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                      className="sr-only"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio professionnelle</Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                placeholder="Décrivez votre parcours et votre approche..."
                rows={4}
              />
              <p className="text-sm text-gray-600 mt-1">
                {form.watch("bio")?.length || 0}/500 caractères
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Adresse professionnelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Adresse</Label>
              <Input
                id="street"
                {...form.register("address.street")}
                placeholder="123 Rue de la Paix"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  {...form.register("address.city")}
                  placeholder="Paris"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  {...form.register("address.postalCode")}
                  placeholder="75001"
                />
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select defaultValue="France">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Belgique">Belgique</SelectItem>
                    <SelectItem value="Suisse">Suisse</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations légales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations légales (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Nom de l'entreprise</Label>
              <Input
                id="businessName"
                {...form.register("businessInfo.businessName")}
                placeholder="SARL Bien-être"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  {...form.register("businessInfo.siret")}
                  placeholder="12345678901234"
                />
              </div>
              <div>
                <Label htmlFor="tva">Numéro TVA</Label>
                <Input
                  id="tva"
                  {...form.register("businessInfo.tva")}
                  placeholder="FR12345678901"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Préférences de notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Préférences de notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications de rendez-vous par email</Label>
                  <p className="text-sm text-gray-600">
                    Recevoir les confirmations et annulations
                  </p>
                </div>
                <Switch
                  checked={form.watch("notifications.emailAppointments")}
                  onCheckedChange={(checked) => 
                    form.setValue("notifications.emailAppointments", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rappels par email</Label>
                  <p className="text-sm text-gray-600">
                    Rappels automatiques avant les rendez-vous
                  </p>
                </div>
                <Switch
                  checked={form.watch("notifications.emailReminders")}
                  onCheckedChange={(checked) => 
                    form.setValue("notifications.emailReminders", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rappels par SMS</Label>
                  <p className="text-sm text-gray-600">
                    Rappels par SMS (plan Premium uniquement)
                  </p>
                </div>
                <Switch
                  checked={form.watch("notifications.smsReminders")}
                  onCheckedChange={(checked) => 
                    form.setValue("notifications.smsReminders", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Emails marketing</Label>
                  <p className="text-sm text-gray-600">
                    Conseils, nouveautés et offres spéciales
                  </p>
                </div>
                <Switch
                  checked={form.watch("notifications.emailMarketing")}
                  onCheckedChange={(checked) => 
                    form.setValue("notifications.emailMarketing", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
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
      </form>
    </div>
  )
}