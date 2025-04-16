// src/components/appointments/appointment-form.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus, Users } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { NewClientForm } from "@/components/clients/new-client-form"
import { RecurrenceForm } from "./recurrence-form"
import { useSession } from "next-auth/react"

const appointmentSchema = z.object({
  clientId: z.string().optional().or(z.literal('')),
  serviceId: z.string().min(1, "Service requis"),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  notes: z.string().optional(),
  // Options de récurrence
  recurrence: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
    weekdays: z.array(z.string()).optional(),
    monthDay: z.number().optional(),
    endType: z.enum(["never", "after", "on"]).default("never"),
    endAfter: z.number().optional(),
    endDate: z.string().optional(),
  }).optional().default({
    enabled: false,
    type: "WEEKLY",
    weekdays: [],
    endType: "never",
  }),
  isGroupClass: z.boolean().default(false),
  maxParticipants: z.number().min(2).optional(),
})
.superRefine((data, ctx) => {
  // Si c'est un cours collectif, clientId n'est pas obligatoire
  if (!data.isGroupClass && !data.clientId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Client requis pour un rendez-vous individuel",
      path: ["clientId"],
    });
  }
  
  // Si c'est un cours collectif, maxParticipants est obligatoire
  if (data.isGroupClass && (!data.maxParticipants || data.maxParticipants < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nombre de participants requis pour un cours collectif",
      path: ["maxParticipants"],
    });
  }
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AppointmentFormValues) => Promise<void>
  defaultValues?: Partial<AppointmentFormValues>
  clients: { id: string; user: { name: string; email: string } }[]
  services: { id: string; name: string; duration: number; maxParticipants?: number }[]
}

export function AppointmentForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  clients,
  services,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNewClientFormOpen, setIsNewClientFormOpen] = useState(false)
  const [localClients, setLocalClients] = useState(clients)
  const [selectedService, setSelectedService] = useState<any>(null)
  const { data: session } = useSession()
  
  // Calculer les valeurs par défaut une seule fois
  const initialValues = useMemo(() => ({
    clientId: "",
    serviceId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    notes: "",
    recurrence: {
      enabled: false,
      type: "WEEKLY" as const,
      weekdays: [] as string[],
      endType: "never" as const,
    },
    isGroupClass: false,
    maxParticipants: 10,
    ...defaultValues // Fusionner avec les valeurs fournies
  }), [defaultValues]); // Dépendance seulement sur defaultValues
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: initialValues
  });
  
  // Réinitialiser le formulaire seulement quand l'état "open" change
  useEffect(() => {
    if (open) {
      // Assurons-nous que isGroupClass est correctement défini
      const isGroup = defaultValues?.isGroupClass === true;
      form.reset({
        ...initialValues,
        isGroupClass: isGroup
      });
    }
  }, [open, form, initialValues, defaultValues]);
  
  // Mettre à jour les clients locaux quand les props clients changent
  useEffect(() => {
    setLocalClients(clients)
  }, [clients])
  
  // Observer les changements de service
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'serviceId' && value.serviceId) {
        const service = services.find(s => s.id === value.serviceId)
        setSelectedService(service)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form, services])

  // Gérer l'ajout d'un nouveau client
  const handleNewClientSuccess = (client: any) => {
    // Mettre à jour la liste des clients
    setLocalClients([...localClients, client])
    // Sélectionner automatiquement le nouveau client
    form.setValue("clientId", client.id)
  }
  
  const handleSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Données du formulaire soumises:", data);
      await onSubmit(data)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement du rendez-vous:", error)
      
      // Vérifier si l'erreur est un conflit d'horaire 
      // et extraire le message si disponible
      if (error.status === 409 || error.message?.includes("Conflit d'horaire")) {
        toast.error(error.message || "Ce créneau horaire chevauche un rendez-vous existant ou une plage bloquée. Veuillez choisir un autre horaire.", {
          duration: 5000, // Durée plus longue pour ce message important
          action: {
            label: "OK",
            onClick: () => {}
          }
        })
      } else {
        toast.error("Erreur lors de l'enregistrement du rendez-vous")
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Chercher le nom du client préselectionné
  const selectedClient = localClients.find(c => c.id === form.getValues().clientId);
  const isGroupClassPossible = !defaultValues?.clientId && selectedService?.maxParticipants > 1;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.clientId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.clientId 
              ? "Modifiez les détails du rendez-vous existant." 
              : "Programmez un nouveau rendez-vous avec un client."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Sélection du service */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Réinitialiser isGroupClass si on change de service
                      form.setValue("isGroupClass", false)
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services
                        .filter(service => service.name !== "Blocage de plage" && (service as any).active !== false) // Filtrer le service de blocage
                        .map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.duration} min) 
                            {service.maxParticipants && service.maxParticipants > 1 && ` - Groupe (max ${service.maxParticipants})`}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Option cours collectif si applicable */}
            {isGroupClassPossible && (
              <FormField
                control={form.control}
                name="isGroupClass"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Cours collectif</FormLabel>
                      <FormDescription>
                        Créer un cours collectif ouvert aux inscriptions
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            {/* Capacité du cours si c'est un cours collectif */}
            {form.watch("isGroupClass") && (
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre maximum de participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="2"
                        max={selectedService?.maxParticipants || 30}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                        value={field.value || (selectedService?.maxParticipants || 10)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sélection du client (uniquement si ce n'est pas un cours collectif) */}
            {!form.watch("isGroupClass") && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <div className="flex items-center space-x-2">
                      {defaultValues?.clientId ? (
                        <div className="flex-1 p-2 border rounded flex items-center h-10">
                          <span>
                            {selectedClient?.user?.name || 'Client sélectionné'}
                          </span>
                          <input type="hidden" {...field} />
                        </div>
                      ) : (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {localClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsNewClientFormOpen(true)}
                        title="Ajouter un nouveau client"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de début</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        step="900" // 15 minutes
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notes supplémentaires pour ce rendez-vous..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Options de récurrence - seulement pour les nouveaux rendez-vous et pas pour les cours en groupe */}
            {!defaultValues?.clientId && !form.watch("isGroupClass") && (
              <RecurrenceForm control={form.control} startDate={form.watch('date')} />
            )}
            
            <DialogFooter className="mt-6 sticky bottom-0 bg-white pt-2 pb-2 border-t">
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
                ) : form.watch("isGroupClass") ? "Créer le cours collectif" : defaultValues?.clientId ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      
      {/* Formulaire d'ajout de client */}
      <NewClientForm
        open={isNewClientFormOpen}
        onOpenChange={setIsNewClientFormOpen}
        onSuccess={handleNewClientSuccess}
        userId={session?.user?.id || ''}
      />
    </Dialog>
  )
}