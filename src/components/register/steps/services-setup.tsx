// src/components/register/steps/services-setup.tsx
"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Plus, 
  Trash2,
  Clock,
  Euro,
  MapPin,
  Lightbulb,
  Sparkles,
  Copy,
  Users
} from "lucide-react"

// Schéma pour un service individuel
const serviceSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.coerce.number().min(15, "Durée minimum : 15 minutes").max(480, "Durée maximum : 8 heures"),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().default("#6746c3"),
  location: z.string().optional(),
})

const servicesFormSchema = z.object({
  services: z.array(serviceSchema).min(1, "Vous devez créer au moins un service"),
})

type ServicesFormData = z.infer<typeof servicesFormSchema>

// Couleurs prédéfinies
const PRESET_COLORS = [
  "#6746c3", "#3b82f6", "#10b981", "#f59e0b", 
  "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
  "#f97316", "#ec4899", "#6b7280", "#dc2626"
]

// Services suggérés selon le type de professionnel
const SERVICE_TEMPLATES = {
  "LIFE_COACH": [
    { name: "Séance de coaching individuel", description: "Accompagnement personnalisé pour atteindre vos objectifs de vie", duration: 60, price: 80, color: "#6746c3", location: "" },
    { name: "Consultation découverte", description: "Premier entretien pour faire connaissance et définir vos besoins", duration: 45, price: 50, color: "#3b82f6", location: "" },
    { name: "Coaching de couple", description: "Séance d'accompagnement pour couples", duration: 90, price: 120, color: "#ec4899", location: "" },
  ],
  "PERSONAL_COACH": [
    { name: "Entraînement personnel", description: "Séance de sport individuelle adaptée à vos objectifs", duration: 60, price: 60, color: "#ef4444", location: "" },
    { name: "Bilan forme et nutrition", description: "Évaluation complète de votre condition physique", duration: 90, price: 80, color: "#f59e0b", location: "" },
    { name: "Coaching en petit groupe", description: "Entraînement en groupe de 2-4 personnes", duration: 60, price: 40, color: "#84cc16", location: "" },
  ],
  "YOGA_TEACHER": [
    { name: "Cours de yoga individuel", description: "Séance de yoga personnalisée selon votre niveau", duration: 60, price: 70, color: "#10b981", location: "" },
    { name: "Cours de yoga en duo", description: "Séance de yoga pour deux personnes", duration: 75, price: 90, color: "#06b6d4", location: "" },
    { name: "Initiation au yoga", description: "Première séance pour découvrir le yoga", duration: 45, price: 50, color: "#8b5cf6", location: "" },
  ],
  "THERAPIST": [
    { name: "Séance de thérapie individuelle", description: "Accompagnement thérapeutique personnalisé", duration: 50, price: 70, color: "#6746c3", location: "" },
    { name: "Première consultation", description: "Entretien initial pour établir le diagnostic", duration: 60, price: 80, color: "#3b82f6", location: "" },
    { name: "Thérapie de couple", description: "Accompagnement thérapeutique pour couples", duration: 90, price: 110, color: "#ec4899", location: "" },
  ],
  "MASSAGE_THERAPIST": [
    { name: "Massage relaxant", description: "Massage de détente pour éliminer le stress", duration: 60, price: 60, color: "#06b6d4", location: "" },
    { name: "Massage thérapeutique", description: "Massage ciblé pour soulager les douleurs", duration: 45, price: 70, color: "#ef4444", location: "" },
    { name: "Massage complet du corps", description: "Massage relaxant de tout le corps", duration: 90, price: 90, color: "#8b5cf6", location: "" },
  ],
  "OTHER": [
    { name: "Consultation personnalisée", description: "Séance individuelle adaptée à vos besoins", duration: 60, price: 60, color: "#6746c3", location: "" },
    { name: "Première rencontre", description: "Entretien découverte pour définir vos objectifs", duration: 45, price: 40, color: "#3b82f6", location: "" },
  ],
  "default": [
    { name: "Consultation", description: "Séance individuelle personnalisée", duration: 60, price: 60, color: "#6746c3", location: "" },
  ]
}

interface ServicesSetupProps {
  onSubmit: (data: ServicesFormData) => void
  onBack: () => void
  professionalType?: string
  initialData?: Partial<ServicesFormData>
  isLoading?: boolean
}

export default function ServicesSetup({ 
  onSubmit, 
  onBack, 
  professionalType = "default",
  initialData,
  isLoading = false 
}: ServicesSetupProps) {
  const [showTemplates, setShowTemplates] = useState(true)
  
  const templates = SERVICE_TEMPLATES[professionalType as keyof typeof SERVICE_TEMPLATES] || SERVICE_TEMPLATES.default

  const form = useForm<ServicesFormData>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: {
      services: initialData?.services || [{
        name: templates[0]?.name || "",
        description: templates[0]?.description || "",
        duration: templates[0]?.duration || 60,
        price: templates[0]?.price || 0,
        color: templates[0]?.color || "#6746c3",
        location: templates[0]?.location || ""
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services"
  })

  const addEmptyService = () => {
    append({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      color: PRESET_COLORS[fields.length % PRESET_COLORS.length],
      location: ""
    })
  }

  const useTemplate = (template: typeof templates[0]) => {
    append({
      name: template.name,
      description: template.description,
      duration: template.duration,
      price: template.price,
      color: template.color,
      location: template.location
    })
  }

  const removeService = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handleSubmit = (data: ServicesFormData) => {
    onSubmit(data)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">Configurez vos services</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Définissez les prestations que vous proposez à vos clients. Vous pourrez en ajouter d'autres plus tard.
        </p>
      </div>

      {/* Information complémentaire avec couleurs lavande */}
      <ConseilBox 
        icon={<Lightbulb className="h-5 w-5" />}
        title="Services individuels"
      >
        <p className="mb-3">
          Les services que vous créez ici sont pour des <strong>rendez-vous individuels</strong> avec vos clients.
        </p>
        <div className="bg-lavender/10 rounded-lg p-3">
          <p className="text-sm">
            <strong>Cours collectifs :</strong> Après votre inscription, vous pourrez créer des cours collectifs 
            depuis votre tableau de bord pour proposer des séances en groupe.
          </p>
        </div>
      </ConseilBox>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* Services suggérés */}
          {showTemplates && templates.length > 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Services suggérés pour votre activité
                  </CardTitle>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowTemplates(false)}
                  >
                    Masquer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.slice(1).map((template, index) => (
                    <div 
                      key={index} 
                      className="group border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => useTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: template.color }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {template.price}€
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mes services */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Mes services ({fields.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={addEmptyService}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer un service
              </Button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative overflow-hidden">
                  {/* Barre colorée */}
                  <div 
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: form.watch(`services.${index}.color`) }}
                  />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Service {index + 1}
                      </CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Ligne 1: Nom + Couleur */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`services.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">Nom du service</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ex: Séance de coaching"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`services.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Couleur</FormLabel>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="w-11 h-11 rounded-lg border border-gray-300"
                                />
                                <Input 
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="#6746c3"
                                  className="h-11"
                                />
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {PRESET_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => field.onChange(color)}
                                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ligne 2: Description */}
                    <FormField
                      control={form.control}
                      name={`services.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez ce service en détail pour attirer vos clients..."
                              className="min-h-[100px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ligne 3: Durée + Prix + Lieu */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`services.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Durée (min)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input 
                                  type="number"
                                  min="15"
                                  max="480"
                                  placeholder="60"
                                  className="pl-10 h-11"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`services.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Prix (€)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="60.00"
                                  className="pl-10 h-11"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`services.${index}.location`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Lieu (optionnel)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input 
                                  placeholder="Cabinet, domicile..."
                                  className="pl-10 h-11"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center justify-between pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              size="lg"
            >
              Précédent
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              size="lg"
              className="px-8"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continuer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}