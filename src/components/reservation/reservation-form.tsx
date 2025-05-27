// src/components/reservation/reservation-form.tsx
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
import { Loader2, CheckCircle, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { formatServicePrice } from "@/lib/utils"
import Link from "next/link"

// Schéma pour l'étape 1 (plus souple)
const step1Schema = z.object({
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  date: z.string().min(1, "Veuillez sélectionner une date"),
  timeSlot: z.string().min(1, "Veuillez sélectionner un horaire"),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// Schéma pour l'étape 2 (plus strict)
const step2Schema = z.object({
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  date: z.string().min(1, "Veuillez sélectionner une date"),
  timeSlot: z.string().min(1, "Veuillez sélectionner un horaire"),
  name: z.string().min(2, "Veuillez entrer votre nom"),
  email: z.string().email("Veuillez entrer un email valide"),
  phone: z.string().min(10, "Veuillez entrer un numéro de téléphone valide"),
  notes: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof step2Schema>;

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
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [formKey, setFormKey] = useState(0);
  
  // Stocker les données de l'étape 1 séparément
  const [step1Data, setStep1Data] = useState({
    serviceId: "",
    date: "",
    timeSlot: ""
  });
  
  // Stocker les données de l'étape 2 séparément
  const [step2Data, setStep2Data] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  
  // Créer le formulaire avec les bonnes valeurs selon l'étape
  const getFormDefaultValues = () => {
    if (step === 1) {
      return {
        serviceId: step1Data.serviceId || preselectedService?.id || "",
        date: step1Data.date || "",
        timeSlot: step1Data.timeSlot || "",
        name: "",
        email: "",
        phone: "",
        notes: "",
      };
    } else {
      return {
        serviceId: step1Data.serviceId,
        date: step1Data.date,
        timeSlot: step1Data.timeSlot,
        name: step2Data.name,
        email: step2Data.email,
        phone: step2Data.phone,
        notes: step2Data.notes,
      };
    }
  };
  
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(step === 1 ? step1Schema : step2Schema),
    defaultValues: getFormDefaultValues(),
    mode: "onChange"
  });
  
  // Récupérer les valeurs du formulaire en temps réel
  const watchServiceId = form.watch("serviceId");
  const watchDate = form.watch("date");
  const watchTimeSlot = form.watch("timeSlot");
  
  // Réinitialiser le formulaire quand l'étape change
  useEffect(() => {
    const newValues = getFormDefaultValues();
    form.reset(newValues);
    setFormKey(prev => prev + 1);
  }, [step]);
  
  // Effet pour réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setStep1Data({
        serviceId: preselectedService?.id || "",
        date: "",
        timeSlot: ""
      });
      setStep2Data({
        name: "",
        email: "",
        phone: "",
        notes: ""
      });
      setStep(1);
      setSuccess(false);
      setShowLoginPrompt(false);
      setFormKey(prev => prev + 1);
    }
  }, [isOpen, preselectedService]);
  
  // Charger les dates disponibles
  useEffect(() => {
    if (watchServiceId) {
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
  
  // Charger les horaires disponibles
  useEffect(() => {
    if (watchServiceId && watchDate) {
      const fetchAvailableTimes = async () => {
        try {
          const response = await fetch(`/api/professionnels/${professional.user.id}/disponibilites?serviceId=${watchServiceId}&date=${watchDate}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.availableTimes && data.availableTimes.length > 0) {
              setAvailableTimes(data.availableTimes);
              return;
            }
          }
          
          // Fallback : simuler différents horaires selon le jour de la semaine
          const date = new Date(watchDate);
          const dayOfWeek = date.getDay();
          
          const times = dayOfWeek === 0 || dayOfWeek === 6
            ? ['10:00', '11:00', '14:00', '15:00']
            : ['09:00', '10:30', '14:00', '15:30', '17:00'];
          
          setAvailableTimes(times);
          
        } catch (error) {
          console.error("Erreur lors du chargement des disponibilités:", error);
          const defaultTimes = ['09:00', '10:30', '14:00', '15:30', '17:00'];
          setAvailableTimes(defaultTimes);
        }
      };
      
      fetchAvailableTimes();
    }
  }, [watchServiceId, watchDate, professional.user.id]);
  
  // Fonction pour passer à l'étape suivante
const handleContinue = async () => {
    // Récupérer les valeurs actuelles du formulaire
    const currentValues = form.getValues();
    
    if (!currentValues.serviceId || !currentValues.date || !currentValues.timeSlot) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    // Sauvegarder les données de l'étape 1
    setStep1Data({
      serviceId: currentValues.serviceId,
      date: currentValues.date,
      timeSlot: currentValues.timeSlot
    });
    
    // Si l'utilisateur n'est pas connecté, proposer de se connecter ou continuer
    if (status === "unauthenticated") {
      setShowLoginPrompt(true);
      return;
    }
    
    // Récupérer les informations complètes de l'utilisateur depuis la base de données
    let userName = "";
    let userEmail = session?.user?.email || "";
    let userPhone = "";  // Nouveau : variable pour le téléphone
    
    if (session?.user?.id) {
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const userData = await response.json();
          // Récupérer toutes les données utilisateur
          userName = userData.name || "";
          userPhone = userData.phone || "";
          console.log("Données utilisateur récupérées:", userData);
        } else {
          console.log("Erreur API utilisateur, utilisation des données de session");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
      }
    }
    
    // Si on n'a toujours pas de nom, utiliser ce qui est dans la session (même si vide)
    if (!userName && session?.user) {
      userName = session.user.name || "";
    }
    
    // Préparer les données de l'étape 2 avec les infos utilisateur
    setStep2Data({
      name: userName,
      email: userEmail,
      phone: userPhone,
      notes: ""
    });
    
    setStep(2);
  }
  
  // Fonction pour continuer sans se connecter
  const handleContinueWithoutLogin = () => {
    setShowLoginPrompt(false);
    
    // Préparer les données de l'étape 2 vides
    setStep2Data({
      name: "",
      email: "",
      phone: "",
      notes: ""
    });
    
    setStep(2);
  }
  
  // Fonction pour soumettre le formulaire
  const onSubmit = async (data: ReservationFormValues) => {
    // Si nous sommes à l'étape 1, on ne devrait pas arriver ici
    if (step === 1) {
      handleContinue();
      return;
    }
    
    // Étape 2 : envoyer la réservation
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId: professional.user.id,
          serviceId: step1Data.serviceId,
          date: step1Data.date,
          startTime: step1Data.timeSlot,
          name: data.name,
          email: data.email,
          phone: data.phone,
          notes: data.notes || "",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la réservation");
      }
      
      toast.success("Votre réservation a été enregistrée avec succès !");
      setSuccess(true);
      
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la réservation. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour gérer la fermeture du formulaire
  const handleClose = () => {
    if (isLoading) return;
    
    // Réinitialiser complètement le formulaire
    setStep1Data({
      serviceId: "",
      date: "",
      timeSlot: ""
    });
    setStep2Data({
      name: "",
      email: "",
      phone: "",
      notes: ""
    });
    setStep(1);
    setSuccess(false);
    setShowLoginPrompt(false);
    setAvailableDates([]);
    setAvailableTimes([]);
    setFormKey(prev => prev + 1);
    onClose();
  };
  
  // Vérifier si tous les champs de l'étape 1 sont remplis
  const isStep1Valid = !!watchServiceId && !!watchDate && !!watchTimeSlot;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {success 
              ? "Réservation confirmée" 
              : showLoginPrompt 
                ? "Se connecter ou continuer"
                : `Réserver avec ${professional.user.name}`}
          </DialogTitle>
          <DialogDescription>
            {success 
              ? "Votre demande de réservation a été envoyée avec succès."
              : showLoginPrompt
                ? "Vous pouvez vous connecter pour pré-remplir vos informations ou continuer en tant qu'invité."
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
              Vous recevrez un email de confirmation à {step2Data.email}. 
              Le professionnel vous contactera pour confirmer votre rendez-vous.
            </p>
            <Button onClick={handleClose} className="bg-lavender hover:bg-lavender/90 text-white border-none">
              Fermer
            </Button>
          </div>
        ) : showLoginPrompt ? (
          <div className="py-6 text-center space-y-4">
            <UserPlus className="h-16 w-16 text-lavender mx-auto mb-4" />
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Connectez-vous pour pré-remplir automatiquement vos informations ou continuez en tant qu'invité.
              </p>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleClose}
                  className="bg-lavender hover:bg-lavender/90 text-white border-none"
                  asChild
                >
                  <Link href="/connexion">
                    Se connecter
                  </Link>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleContinueWithoutLogin}
                >
                  Continuer en tant qu'invité
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                Pas encore de compte ? <Link href="/inscription" className="text-lavender hover:underline">Créer un compte</Link>
              </p>
            </div>
          </div>
        ) : (
          <Form {...form} key={formKey}>
            <div className="space-y-4">
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
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professional.services && professional.services.map((service: any) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - {formatServicePrice(service.price)} ({service.duration} min)
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
                            value={field.value}
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
                            value={field.value}
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
                          <Input 
                            {...field} 
                            disabled={isLoading}
                            placeholder="Votre nom complet"
                          />
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
                          <Input 
                            {...field} 
                            type="email" 
                            disabled={isLoading}
                            placeholder="votre@email.com"
                          />
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
                          <Input 
                            {...field} 
                            disabled={isLoading}
                            placeholder="06 12 34 56 78"
                          />
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
                
                {step === 1 ? (
                  <Button 
                    type="button" 
                    onClick={handleContinue}
                    disabled={isLoading || !isStep1Valid}
                    className="bg-lavender hover:bg-lavender/90 text-white border-none"
                  >
                    Continuer
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isLoading}
                    className="bg-lavender hover:bg-lavender/90 text-white border-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : "Réserver"}
                  </Button>
                )}
              </DialogFooter>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}