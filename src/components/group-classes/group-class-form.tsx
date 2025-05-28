// src/components/group-classes/group-class-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Plus, MapPin, Wifi } from "lucide-react"
import { toast } from "sonner"

const groupClassSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: z.number().min(0, "Le prix doit être positif"),
  duration: z.number().min(15, "La durée minimum est de 15 minutes"),
  maxParticipants: z.number().min(2, "Au moins 2 participants requis").max(50, "Maximum 50 participants"),
  category: z.string().min(1, "Sélectionnez une catégorie"),
  level: z.string().optional(),
  isOnline: z.boolean(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  equipment: z.array(z.string()).default([]),
})

export type GroupClassFormData = z.infer<typeof groupClassSchema>

const CATEGORIES = [
  { value: "YOGA", label: "Yoga" },
  { value: "PILATES", label: "Pilates" },
  { value: "FITNESS", label: "Fitness" },
  { value: "MEDITATION", label: "Méditation" },
  { value: "DANSE", label: "Danse" },
  { value: "RELAXATION", label: "Relaxation" },
  { value: "AUTRES", label: "Autres" },
]

const LEVELS = [
  { value: "DEBUTANT", label: "Débutant" },
  { value: "INTERMEDIAIRE", label: "Intermédiaire" },
  { value: "AVANCE", label: "Avancé" },
  { value: "TOUS_NIVEAUX", label: "Tous niveaux" },
]

export interface GroupClassFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: GroupClassFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<GroupClassFormData>
}

export function GroupClassForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onCancel, 
  initialData 
}: GroupClassFormProps) {
  const [equipment, setEquipment] = useState<string[]>(initialData?.equipment || [])
  const [newEquipment, setNewEquipment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GroupClassFormData>({
    resolver: zodResolver(groupClassSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 20,
      duration: 60,
      maxParticipants: 10,
      category: "",
      level: "TOUS_NIVEAUX",
      isOnline: false,
      address: "",
      city: "",
      postalCode: "",
      equipment: [],
      ...initialData,
    },
  })

  // Réinitialiser le formulaire quand initialData change
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
      setEquipment(initialData.equipment || [])
    } else {
      form.reset({
        name: "",
        description: "",
        price: 20,
        duration: 60,
        maxParticipants: 10,
        category: "",
        level: "TOUS_NIVEAUX",
        isOnline: false,
        address: "",
        city: "",
        postalCode: "",
        equipment: [],
      })
      setEquipment([])
    }
  }, [initialData, form])

  const isOnline = form.watch("isOnline")

  const addEquipment = () => {
    if (newEquipment.trim() && !equipment.includes(newEquipment.trim())) {
      const newList = [...equipment, newEquipment.trim()]
      setEquipment(newList)
      form.setValue("equipment", newList)
      setNewEquipment("")
    }
  }

  const removeEquipment = (item: string) => {
    const newList = equipment.filter(e => e !== item)
    setEquipment(newList)
    form.setValue("equipment", newList)
  }

  const handleSubmit = async (data: GroupClassFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit({ ...data, equipment })
    } catch (error) {
      // L'erreur sera gérée par le composant parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifier le cours collectif" : "Nouveau cours collectif"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Modifiez les informations de votre cours collectif" 
              : "Créez un nouveau cours collectif pour vos clients"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du cours</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Yoga du matin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez votre cours, son approche, ses bienfaits..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Détails pratiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants max</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type de cours */}
            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-normal">
                      {field.value ? "Cours en ligne" : "Cours en présentiel"}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {field.value ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          Les participants se connectent à distance
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-blue-500" />
                          Les participants se rendent sur place
                        </>
                      )}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Localisation (si présentiel) */}
            {!isOnline && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-medium">Lieu du cours</h3>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Rue de la Paix" {...field} />
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
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
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
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="75001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Matériel requis */}
            <div className="space-y-4">
              <FormLabel>Matériel requis (optionnel)</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Tapis de yoga, bouteille d'eau..."
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                />
                <Button type="button" onClick={addEquipment} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {equipment.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <Badge key={item} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeEquipment(item)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : (initialData ? "Modifier" : "Créer le cours")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}