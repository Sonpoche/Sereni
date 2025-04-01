// src/components/profile/schedule-tab.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, X, Clock, Calendar, CalendarRange } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Interface pour typifier le slot de temps
interface TimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  professionalId: string;
}

// Interface pour typifier les paramètres du professionnel
interface ProfessionalSettings {
  bufferTime: number; // Temps de préparation entre rendez-vous en minutes
  autoConfirmBookings: boolean;
}

// Interface pour typifier les données du profil
interface ProfileData {
  id?: string;
  name?: string;
  professionalProfile?: {
    id?: string;
    autoConfirmBookings?: boolean;
    bufferTime?: number;
  };
}

const timeSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
}).refine(
  (data) => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return endMinutes > startMinutes;
  },
  {
    message: "L'heure de fin doit être ultérieure à l'heure de début",
    path: ["endTime"]
  }
);

const settingsSchema = z.object({
  bufferTime: z.number().min(0).max(120),
  autoConfirmBookings: z.boolean(),
});

type TimeSlotFormValues = z.infer<typeof timeSlotSchema>
type SettingsFormValues = z.infer<typeof settingsSchema>

const dayNames = [
  "Dimanche",
  "Lundi", 
  "Mardi", 
  "Mercredi", 
  "Jeudi", 
  "Vendredi", 
  "Samedi"
];

const bufferTimeOptions = [
  { value: 0, label: "Aucun" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 heure" },
];

export default function ScheduleTab({ profileData }: { profileData: ProfileData }) {
  const { data: session } = useSession()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState<ProfessionalSettings>({
    bufferTime: profileData?.professionalProfile?.bufferTime || 0,
    autoConfirmBookings: profileData?.professionalProfile?.autoConfirmBookings || false,
  })

  // Configuration du formulaire pour les horaires
  const hoursForm = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      dayOfWeek: 1, // Lundi par défaut
      startTime: "09:00",
      endTime: "17:00",
    }
  })

  // Configuration du formulaire pour les paramètres
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      bufferTime: settings.bufferTime,
      autoConfirmBookings: settings.autoConfirmBookings,
    }
  })

  // Chargement des créneaux horaires et paramètres
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        
        // Chargement des horaires
        const availabilityResponse = await fetch(`/api/users/${session.user.id}/availability`)
        
        if (!availabilityResponse.ok) {
          throw new Error("Erreur lors du chargement des horaires")
        }
        
        const availabilityData = await availabilityResponse.json()
        setTimeSlots(availabilityData.timeSlots || [])
        
        // Chargement des paramètres
        const settingsResponse = await fetch(`/api/users/${session.user.id}/settings`)
        
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings({
            bufferTime: settingsData.bufferTime || 0,
            autoConfirmBookings: settingsData.autoConfirmBookings || false,
          })
          
          // Mettre à jour les valeurs par défaut du formulaire
          settingsForm.reset({
            bufferTime: settingsData.bufferTime || 0,
            autoConfirmBookings: settingsData.autoConfirmBookings || false,
          })
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [session?.user?.id, settingsForm])

  // Soumission du formulaire d'ajout/mise à jour de créneau
  async function onSubmit(data: TimeSlotFormValues) {
    setIsSubmitting(true)
    
    try {
      console.log("Données du formulaire horaires:", data);
      
      // Rechercher si un créneau existe déjà pour ce jour spécifique
      const existingSlotForDay = timeSlots.find(slot => slot.dayOfWeek === data.dayOfWeek);
      
      let response;
      
      if (existingSlotForDay) {
        // Si un créneau existe déjà pour ce jour, le mettre à jour
        console.log(`Mise à jour du créneau pour le jour ${data.dayOfWeek} (${dayNames[data.dayOfWeek]}), ID: ${existingSlotForDay.id}`);
        
        response = await fetch(`/api/users/${session?.user?.id}/availability/${existingSlotForDay.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startTime: data.startTime,
            endTime: data.endTime,
            dayOfWeek: data.dayOfWeek
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erreur de mise à jour:", errorData);
          throw new Error("Erreur lors de la mise à jour du créneau horaire");
        }

        const updatedTimeSlot = await response.json();
        
        // Mettre à jour la liste des créneaux en remplaçant l'ancien
        setTimeSlots(prev => 
          prev.map(slot => slot.id === existingSlotForDay.id ? updatedTimeSlot : slot)
        );
        
        toast.success(`Créneau horaire pour ${dayNames[data.dayOfWeek]} mis à jour avec succès`);
      } else {
        // Sinon, créer un nouveau créneau
        console.log(`Création d'un nouveau créneau pour le jour ${data.dayOfWeek} (${dayNames[data.dayOfWeek]})`);
        
        response = await fetch(`/api/users/${session?.user?.id}/availability`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erreur de création:", errorData);
          throw new Error("Erreur lors de l'ajout du créneau horaire");
        }

        const newTimeSlot = await response.json();
        
        setTimeSlots(prev => [...prev, newTimeSlot]);
        
        toast.success(`Créneau horaire pour ${dayNames[data.dayOfWeek]} ajouté avec succès`);
      }
      
      hoursForm.reset({
        dayOfWeek: data.dayOfWeek, // Garder le même jour sélectionné après la soumission
        startTime: "09:00",
        endTime: "17:00",
      });
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'ajout ou de la mise à jour du créneau horaire")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Soumission du formulaire des paramètres
  async function onSubmitSettings(data: SettingsFormValues) {
    setIsSubmitting(true)
    
    try {
      console.log("Données du formulaire paramètres:", data);
      
      const response = await fetch(`/api/users/${session?.user?.id}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur de mise à jour des paramètres:", errorData);
        throw new Error("Erreur lors de la mise à jour des paramètres");
      }

      const updatedSettings = await response.json();
      
      // Mettre à jour les paramètres locaux
      setSettings({
        bufferTime: updatedSettings.bufferTime,
        autoConfirmBookings: updatedSettings.autoConfirmBookings,
      });
      
      toast.success("Paramètres mis à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour des paramètres")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Suppression d'un créneau horaire
  async function deleteTimeSlot(id: string) {
    try {
      console.log(`Tentative de suppression du créneau: ${id}`);
      const response = await fetch(`/api/users/${session?.user?.id}/availability/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur de suppression:", errorData);
        throw new Error("Erreur lors de la suppression du créneau horaire")
      }

      setTimeSlots(prev => prev.filter(slot => slot.id !== id))
      toast.success("Créneau horaire supprimé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du créneau horaire")
    }
  }

  // Fonction pour répéter les horaires sur tous les jours
  async function repeatForAllDays() {
    try {
      // Obtenir les valeurs actuelles du formulaire
      const currentValues = hoursForm.getValues();
      setIsSubmitting(true);
      
      // Pour chaque jour de la semaine (0-6)
      for (let day = 0; day < 7; day++) {
        // Trouver s'il existe déjà un créneau pour ce jour
        const existingSlot = timeSlots.find(slot => slot.dayOfWeek === day);
        
        // Préparer les données à envoyer
        const dayData = {
          dayOfWeek: day,
          startTime: currentValues.startTime,
          endTime: currentValues.endTime
        };
        
        if (existingSlot) {
          // Mettre à jour le créneau existant
          await fetch(`/api/users/${session?.user?.id}/availability/${existingSlot.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dayData),
          });
        } else {
          // Créer un nouveau créneau
          await fetch(`/api/users/${session?.user?.id}/availability`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dayData),
          });
        }
      }
      
      // Actualiser la liste des créneaux après la mise à jour
      const response = await fetch(`/api/users/${session?.user?.id}/availability`);
      const data = await response.json();
      setTimeSlots(data.timeSlots || []);
      
      toast.success("Horaires appliqués à tous les jours de la semaine");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'application des horaires");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Fonction pour répéter les horaires sur les jours ouvrables uniquement
  async function repeatForWeekdays() {
    try {
      // Obtenir les valeurs actuelles du formulaire
      const currentValues = hoursForm.getValues();
      setIsSubmitting(true);
      
      // Pour chaque jour ouvrable (1-5 = lundi à vendredi)
      for (let day = 1; day <= 5; day++) {
        // Trouver s'il existe déjà un créneau pour ce jour
        const existingSlot = timeSlots.find(slot => slot.dayOfWeek === day);
        
        // Préparer les données à envoyer
        const dayData = {
          dayOfWeek: day,
          startTime: currentValues.startTime,
          endTime: currentValues.endTime
        };
        
        if (existingSlot) {
          // Mettre à jour le créneau existant
          await fetch(`/api/users/${session?.user?.id}/availability/${existingSlot.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dayData),
          });
        } else {
          // Créer un nouveau créneau
          await fetch(`/api/users/${session?.user?.id}/availability`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dayData),
          });
        }
      }
      
      // Actualiser la liste des créneaux après la mise à jour
      const response = await fetch(`/api/users/${session?.user?.id}/availability`);
      const data = await response.json();
      setTimeSlots(data.timeSlots || []);
      
      toast.success("Horaires appliqués aux jours ouvrables (lundi-vendredi)");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'application des horaires");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Formatage de l'heure pour l'affichage
  const formatTime = (time: string) => {
    // Format 24h français
    return time;
  }

  const handleSubmitButton = () => {
    const currentDay = hoursForm.getValues().dayOfWeek;
    const existingSlot = timeSlots.find(slot => slot.dayOfWeek === currentDay);
    
    if (existingSlot) {
      return (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Mettre à jour le créneau
            </>
          )}
        </Button>
      );
    } else {
      return (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ajout...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un créneau
            </>
          )}
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="horaires" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="horaires">Horaires hebdomadaires</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres avancés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="horaires">
          <Card>
            <CardHeader>
              <CardTitle>Horaires de travail</CardTitle>
              <CardDescription>
                Définissez vos horaires habituels pour chaque jour de la semaine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulaire d'ajout de créneau */}
              <Form {...hoursForm}>
                <form onSubmit={hoursForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Jour de la semaine */}
                    <FormField
                      control={hoursForm.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jour</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const dayIndex = parseInt(value, 10);
                              field.onChange(dayIndex);
                            }}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un jour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dayNames.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Heure de début */}
                    <FormField
                      control={hoursForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure de début</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="HH:MM"
                              pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Heure de fin */}
                    <FormField
                      control={hoursForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure de fin</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="HH:MM"
                              pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4">
                    {/* Boutons de répétition */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={repeatForWeekdays} 
                        disabled={isSubmitting}
                        className="flex items-center"
                      >
                        <CalendarRange className="h-4 w-4 mr-2" />
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Appliquer lun-ven"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={repeatForAllDays} 
                        disabled={isSubmitting}
                        className="flex items-center"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Appliquer tous les jours"
                        )}
                      </Button>
                    </div>
                    
                    {/* Bouton d'ajout/mise à jour */}
                    <div>
                      {handleSubmitButton()}
                    </div>
                  </div>
                </form>
              </Form>
              
              {/* Liste des créneaux horaires */}
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-4">Créneaux horaires actuels</h3>
                
                {timeSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Clock className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Vous n'avez pas encore défini de créneaux horaires.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeSlots
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((slot) => (
                        <div 
                          key={slot.id} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="w-24 font-medium">{dayNames[slot.dayOfWeek]}</div>
                            <div>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteTimeSlot(slot.id)}
                            aria-label="Supprimer ce créneau"
                          >
                            <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Section des jours fermés */}
              <div className="mt-8 border-t pt-6">
                <h3 className="font-medium text-lg mb-4">Jours fermés</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les jours où vous ne proposez pas de rendez-vous.
                  Ces jours apparaîtront comme indisponibles dans votre calendrier.
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {dayNames.map((day, index) => {
                    // Vérifier si ce jour a un créneau horaire (donc n'est pas fermé)
                    const hasBusiness = timeSlots.some(slot => slot.dayOfWeek === index);
                    
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`closed-${index}`}
                          checked={!hasBusiness}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Supprimer tous les créneaux pour ce jour (marquer comme fermé)
                              timeSlots
                                .filter(slot => slot.dayOfWeek === index)
                                .forEach(slot => deleteTimeSlot(slot.id));
                            } else {
                              // Ajouter un créneau par défaut pour ce jour (marquer comme ouvert)
                              onSubmit({
                                dayOfWeek: index,
                                startTime: "09:00",
                                endTime: "17:00"
                              });
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`closed-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day} fermé
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parametres">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres avancés</CardTitle>
              <CardDescription>
                Configurez des options supplémentaires pour vos rendez-vous et disponibilités.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="space-y-6">
                  {/* Section temps tampon */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-lg">Temps de préparation entre rendez-vous</h3>
                    </div>
                    
                    <FormField
                      control={settingsForm.control}
                      name="bufferTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temps entre les rendez-vous</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue placeholder="Sélectionner un temps" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bufferTimeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Option d'auto-confirmation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-lg">Confirmation des rendez-vous</h3>
                    </div>
                    
                    <FormField
                      control={settingsForm.control}
                      name="autoConfirmBookings"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Confirmation automatique
                            </FormLabel>
                            <FormDescription>
                              Confirmer automatiquement les réservations effectuées pendant vos horaires d'ouverture
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
                  </div>
                  
                  <div className="pt-6 flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer les paramètres"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}