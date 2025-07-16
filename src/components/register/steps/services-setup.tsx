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
  Settings,
  Clock,
  Euro,
  Palette,
  Lightbulb,
  CheckCircle
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

// Schéma pour le formulaire complet
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

// Services exemples selon le type de professionnel
const SERVICE_TEMPLATES = {
  "coach": [
    { name: "Coaching individuel", description: "Séance de coaching personnalisée pour atteindre vos objectifs", duration: 60, price: 80, color: "#6746c3" },
    { name: "Consultation découverte", description: "Premier entretien pour faire connaissance et définir vos besoins", duration: 30, price: 40, color: "#3b82f6" },
  ],
  "therapeute": [
    { name: "Séance de thérapie", description: "Accompagnement thérapeutique individuel", duration: 50, price: 70, color: "#10b981" },
    { name: "Première consultation", description: "Entretien initial pour établir le diagnostic et le plan de traitement", duration: 60, price: 80, color: "#f59e0b" },
  ],
  "masseur": [
    { name: "Massage relaxant", description: "Massage de détente pour éliminer le stress et les tensions", duration: 60, price: 60, color: "#8b5cf6" },
    { name: "Massage thérapeutique", description: "Massage ciblé pour soulager les douleurs musculaires", duration: 45, price: 70, color: "#ef4444" },
  ],
  "default": [
    { name: "Consultation", description: "Séance individuelle personnalisée", duration: 60, price: 60, color: "#6746c3" },
    { name: "Première rencontre", description: "Entretien découverte pour définir vos besoins", duration: 30, price: 30, color: "#3b82f6" },
  ]
}

interface ServicesSetupProps {
  onSubmit: (data: ServicesFormData) => void
  onBack: () => void
  professionalType?: string
  isLoading?: boolean
}

export default function ServicesSetup({ 
  onSubmit, 
  onBack, 
  professionalType = "default",
  isLoading = false 
}: ServicesSetupProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Obtenir les templates selon le type de professionnel
  const templates = SERVICE_TEMPLATES[professionalType as keyof typeof SERVICE_TEMPLATES] || SERVICE_TEMPLATES.default

  const form = useForm<ServicesFormData>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: {
      services: [templates[0]] // Commencer avec le premier template
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services"
  })

  // Ajouter un service vide
  const addService = () => {
    append({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      color: PRESET_COLORS[fields.length % PRESET_COLORS.length],
      location: ""
    })
  }

  // Utiliser un template
  const useTemplate = (template: typeof templates[0]) => {
    const currentServices = form.getValues("services")
    const updatedServices = [...currentServices, template]
    form.setValue("services", updatedServices)
  }

  // Supprimer un service
  const removeService = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handleSubmit = (data: ServicesFormData) => {
    console.log("Services à créer:", data)
    onSubmit(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-title font-medium">Configurez vos services</h2>
        <p className="text-gray-600">
          Définissez les services que vous proposez à vos clients
        </p>
      </div>

      <ConseilBox>
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">Conseils pour vos services</h4>
            <ul className="text-sm space-y-1">
              <li>• Créez au moins un service pour commencer</li>
              <li>• Vous pourrez ajouter d'autres services plus tard</li>
              <li>• Soyez descriptif pour attirer vos clients</li>
              <li>• Utilisez des couleurs différentes pour bien les distinguer</li>
            </ul>
          </div>
        </div>
      </ConseilBox>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Templates suggérés */}
          {templates.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Services suggérés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.slice(1).map((template, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: template.color }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
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
                        variant="outline"
                        size="sm"
                        onClick={() => useTemplate(template)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter ce service
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des services */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Vos services</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addService}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un service
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Service {index + 1}
                    </CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`services.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du service</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Coaching individuel" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`services.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Couleur</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input 
                                type="color" 
                                {...field} 
                                className="w-16 h-10 p-1" 
                              />
                            </FormControl>
                            <div className="flex gap-1">
                              {PRESET_COLORS.slice(0, 6).map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    field.value === color 
                                      ? 'border-gray-900' 
                                      : 'border-gray-200'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => field.onChange(color)}
                                />
                              ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`services.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez votre service..." 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`services.${index}.duration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="15"
                              max="480"
                              step="15"
                              {...field}
                            />
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
                          <FormLabel>Prix (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                            />
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
                          <FormLabel>Lieu (optionnel)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Cabinet, domicile..."
                              {...field}
                            />
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

          {/* Boutons de navigation */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
            >
              Précédent
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Créer mes services
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}