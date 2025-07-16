// src/components/appointments/appointment-form.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Clock, User, UserPlus, Plus, Loader2, Euro } from "lucide-react"
import { toast } from "sonner"
import { NewClientForm } from "@/components/clients/new-client-form"

// Schéma de validation pour les rendez-vous individuels uniquement
const appointmentSchema = z.object({
  clientId: z.string().min(1, "Veuillez sélectionner un client"),
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  date: z.string().min(1, "La date est requise"),
  startTime: z.string().min(1, "L'heure de début est requise"),
  notes: z.string().optional(),
  recurrence: z.object({
    enabled: z.boolean(),
    type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
    weekdays: z.array(z.string()),
    endType: z.enum(["never", "date", "count"]),
    endDate: z.string().optional(),
    endAfter: z.number().optional(),
  }).optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AppointmentFormValues) => Promise<void>
  defaultValues?: Partial<AppointmentFormValues>
  clients: { id: string; user: { name: string; email: string } }[]
  services: { id: string; name: string; duration: number; price: number }[]
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
  
  // Calculer les valeurs par défaut
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
  
  // Réinitialiser le formulaire quand il s'ouvre
  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [open, form, initialValues])
  
  // Mettre à jour les clients locaux
  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

  // Gérer l'ajout d'un nouveau client
  const handleNewClientSuccess = (client: any) => {
    setLocalClients([...localClients, client])
    form.setValue("clientId", client.id)
    setIsNewClientFormOpen(false)
    toast.success("Client ajouté avec succès")
  }
  
  const handleSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Données du formulaire soumises:", data);
      await onSubmit(data)
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error)
      
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

  // Obtenir le service et le client sélectionnés
  const selectedService = services.find(s => s.id === form.watch('serviceId'))
  const selectedClient = localClients.find(c => c.id === form.watch('clientId'))
  
  // Calculer l'heure de fin basée sur la durée du service
  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return ""
    
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + duration * 60000)
    
    return endDate.toTimeString().substring(0, 5)
  }

  const startTime = form.watch('startTime')
  const endTime = selectedService && startTime 
    ? calculateEndTime(startTime, selectedService.duration)
    : ""
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {defaultValues?.clientId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
            </DialogTitle>
            <DialogDescription>
              {defaultValues?.clientId 
                ? "Modifiez les détails du rendez-vous existant."
                : "Créez un nouveau rendez-vous individuel avec un client."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Sélection du client */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {localClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {client.user.name} ({client.user.email})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsNewClientFormOpen(true)}
                        title="Ajouter un nouveau client"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sélection du service */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{service.name}</span>
                                <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                                  <Clock className="h-3 w-3" />
                                  {service.duration}min
                                  <Euro className="h-3 w-3" />
                                  {service.price.toLocaleString('fr-FR', { 
                                    style: 'currency', 
                                    currency: 'EUR' 
                                  })}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Informations sur le rendez-vous */}
              {(selectedService || selectedClient) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Résumé du rendez-vous</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedClient && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{selectedClient.user.name}</span>
                        <span className="text-gray-500">({selectedClient.user.email})</span>
                      </div>
                    )}
                    
                    {selectedService && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Durée : {selectedService.duration} minutes</span>
                          {endTime && (
                            <span className="text-gray-500">
                              ({startTime} - {endTime})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="h-4 w-4 text-gray-500" />
                          <span>Prix : </span>
                          <Badge variant="secondary">
                            {selectedService.price.toLocaleString('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
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
                        <Input
                          type="date"
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
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
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes sur le rendez-vous..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Récurrence */}
              <div className="space-y-4">
                <Separator />
                <FormField
                  control={form.control}
                  name="recurrence.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Récurrence</FormLabel>
                        <FormDescription>
                          Créer plusieurs rendez-vous automatiquement
                        </FormDescription>
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

                {form.watch('recurrence.enabled') && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <FormField
                      control={form.control}
                      name="recurrence.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fréquence</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la fréquence" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                                <SelectItem value="DAILY">Quotidien</SelectItem>
                                <SelectItem value="MONTHLY">Mensuel</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('recurrence.type') === 'WEEKLY' && (
                      <FormField
                        control={form.control}
                        name="recurrence.weekdays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jours de la semaine</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: '1', label: 'Lun' },
                                { value: '2', label: 'Mar' },
                                { value: '4', label: 'Jeu' },
                                { value: '5', label: 'Ven' },
                                { value: '6', label: 'Sam' },
                                { value: '0', label: 'Dim' },
                              ].map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`day-${day.value}`}
                                    checked={field.value?.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...(field.value || []), day.value])
                                      } else {
                                        field.onChange(field.value?.filter((d: string) => d !== day.value))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                                    {day.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="recurrence.endType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fin de récurrence</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Quand arrêter" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">Jamais</SelectItem>
                                <SelectItem value="date">À une date</SelectItem>
                                <SelectItem value="count">Après un nombre</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('recurrence.endType') === 'date' && (
                      <FormField
                        control={form.control}
                        name="recurrence.endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de fin</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                min={form.watch('date')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch('recurrence.endType') === 'count' && (
                      <FormField
                        control={form.control}
                        name="recurrence.endAfter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre d'occurrences</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {defaultValues?.clientId ? "Modifier" : "Créer"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Formulaire de nouveau client */}
      <NewClientForm
        open={isNewClientFormOpen}
        onOpenChange={setIsNewClientFormOpen}
        onSuccess={handleNewClientSuccess}
        userId={session?.user?.id || ""}
      />
    </>
  )
}