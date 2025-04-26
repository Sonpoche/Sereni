"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

// Simplification du schéma
const reservationSchema = z.object({
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  date: z.string().min(1, "Veuillez sélectionner une date"),
  timeSlot: z.string().min(1, "Veuillez sélectionner un horaire"),
  name: z.string().min(2, "Veuillez entrer votre nom"),
  email: z.string().email("Veuillez entrer un email valide"),
  phone: z.string().min(10, "Veuillez entrer un numéro de téléphone valide"),
  notes: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface ReservationFormProps {
  professional: any;
  preselectedService?: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationForm({
  professional,
  preselectedService,
  isOpen,
  onClose,
}: ReservationFormProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Créer le formulaire avec React Hook Form et validation Zod
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      serviceId: preselectedService?.id || "",
      date: "",
      timeSlot: "",
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      phone: "",
      notes: "",
    },
  });
  
  // Récupérer les valeurs du formulaire en temps réel
  const watchServiceId = form.watch("serviceId");
  const watchDate = form.watch("date");
  
  // Simuler des dates disponibles (à remplacer par une vraie API)
  useEffect(() => {
    if (watchServiceId) {
      // Générer des dates pour le mois en cours
      const today = new Date();
      const dates = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(format(date, 'yyyy-MM-dd'));
      }
      
      setAvailableDates(dates);
    }
  }, [watchServiceId]);
  
  // Simuler des horaires disponibles (à remplacer par une vraie API)
  useEffect(() => {
    if (watchServiceId && watchDate) {
      // Simuler différents horaires selon le jour de la semaine
      const date = new Date(watchDate);
      const dayOfWeek = date.getDay();
      
      // Horaires différents pour le weekend
      const times = dayOfWeek === 0 || dayOfWeek === 6
        ? ['10:00', '11:00', '14:00', '15:00']
        : ['09:00', '10:30', '14:00', '15:30', '17:00'];
      
      setAvailableTimes(times);
    }
  }, [watchServiceId, watchDate]);
  
  // Fonction pour soumettre le formulaire
  const onSubmit = async (data: ReservationFormValues) => {
    setIsLoading(true);
    
    try {
      // Si nous sommes à l'étape 1, passer à l'étape 2
      if (step === 1) {
        setStep(2);
        setIsLoading(false);
        return;
      }
      
      // Simuler un succès pour le moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      
      // En production, décommenter pour envoyer la réservation
      /*
      const response = await fetch(`/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId: professional.user.id,
          serviceId: data.serviceId,
          date: data.date,
          startTime: data.timeSlot,
          name: data.name,
          email: data.email,
          phone: data.phone,
          notes: data.notes || "",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la réservation");
      }
      
      setSuccess(true);
      */
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la réservation. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour gérer la fermeture du formulaire
  const handleClose = () => {
    if (isLoading) return; // Empêcher la fermeture pendant le chargement
    
    // Réinitialiser le formulaire
    form.reset();
    setStep(1);
    setSuccess(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {success 
              ? "Réservation confirmée" 
              : `Réserver avec ${professional.user.name}`}
          </DialogTitle>
          <DialogDescription>
            {success 
              ? "Votre demande de réservation a été envoyée avec succès."
              : step === 1 
                ? "Choisissez un service et un créneau horaire."
                : "Complétez vos informations personnelles pour finaliser la réservation."}
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Merci pour votre réservation !</h3>
            <p className="mb-6 text-sm text-gray-600">
              Vous recevrez un email de confirmation à {form.getValues("email")}. 
              Le professionnel vous contactera pour confirmer votre rendez-vous.
            </p>
            <Button onClick={handleClose}>Fermer</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 ? (
                <>
                  {/* Étape 1: Choix du service et de l'horaire */}
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professional.services.map((service: any) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - {service.price.toFixed(2)}€ ({service.duration} min)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchServiceId && (
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une date" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableDates.map((date) => (
                                <SelectItem key={date} value={date}>
                                  {format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {watchServiceId && watchDate && (
                    <FormField
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horaire</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un horaire" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTimes.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Étape 2: Informations personnelles */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Informations supplémentaires..." 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <DialogFooter>
                {step === 2 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="mr-2"
                  >
                    Retour
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isLoading || (step === 1 && (!watchServiceId || !watchDate || !form.getValues("timeSlot")))}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : step === 1 ? "Continuer" : "Réserver"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}