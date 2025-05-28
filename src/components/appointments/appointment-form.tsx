// src/components/appointments/appointment-form.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus } from "lucide-react"
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
import { NewClientForm } from "@/components/clients/new-client-form"
import { RecurrenceForm } from "./recurrence-form"
import { useSession } from "next-auth/react"

const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
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
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AppointmentFormValues) => Promise<void>
  defaultValues?: Partial<AppointmentFormValues>
  clients: { id: string; user: { name: string; email: string } }[]
  services: { id: string; name: string; duration: number }[]
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
    ...defaultValues
  }), [defaultValues])
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: initialValues
  });
  
  // Réinitialiser le formulaire quand l'état "open" change
  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [open, form, initialValues]);
  
  // Mettre à jour les clients locaux quand les props clients changent
  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

  // Gérer l'ajout d'un nouveau client
  const handleNewClientSuccess = (client: any) => {
    setLocalClients([...localClients, client])
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
      
      if (error.status === 409 || error.message?.includes("Conflit d'horaire")) {
        toast.error(error.message || "Ce créneau horaire chevauche un rendez-vous existant. Veuillez choisir un autre horaire.", {
          duration: 5000,
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
              : "Programmez un nouveau rendez-vous individuel avec un client."}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services
                        .filter(service => service.name !== "Blocage de plage" && (service as any).active !== false)
                        .map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.duration} min)
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sélection du client */}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
            
            {/* Options de récurrence - seulement pour les nouveaux rendez-vous */}
            {!defaultValues?.clientId && (
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
                ) : defaultValues?.clientId ? "Mettre à jour" : "Créer"}
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