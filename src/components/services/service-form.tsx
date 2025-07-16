// src/components/services/service-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// Schéma simplifié sans cours collectifs
const serviceSchema = z.object({
  name: z.string().min(3, "Le nom du service doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  duration: z.coerce.number().min(5, "La durée minimum est de 5 minutes").max(480, "La durée maximum est de 8 heures"),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  color: z.string().default("#6746c3"),
  location: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormValues) => Promise<void>;
  defaultValues?: Partial<ServiceFormValues>;
}

export function ServiceForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      duration: 60,
      price: 0,
      color: "#6746c3",
      location: "",
    }
  });
  
  // Réinitialiser le formulaire quand open ou defaultValues changent
  useEffect(() => {
    if (open && defaultValues) {
      console.log("Réinitialisation du formulaire avec:", defaultValues);
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);
  
  const handleSubmit = async (data: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du service:", error);
      toast.error("Erreur lors de l'enregistrement du service");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.name ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.name 
              ? "Modifiez les détails de votre service existant." 
              : "Créez un nouveau service pour vos rendez-vous individuels."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nom du service */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du service</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Coaching individuel, Consultation..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez votre service en détail..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Durée et prix */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="5"
                        max="480"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        value={typeof field.value === 'undefined' || field.value === null ? '' : String(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                        value={typeof field.value === 'undefined' || field.value === null ? '' : String(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Couleur */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur du service</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        type="color" 
                        {...field} 
                        className="w-16 h-10 p-1" 
                      />
                    </FormControl>
                    <span className="text-sm text-gray-500">{field.value}</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Lieu (optionnel) */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Cabinet, domicile, en ligne..." />
                  </FormControl>
                  <FormDescription>
                    Indiquez où se déroule le service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : defaultValues?.name ? "Mettre à jour" : "Créer le service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}