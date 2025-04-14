// src/components/appointments/block-time-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const blockTimeSchema = z.object({
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  title: z.string().min(1, "Titre requis"),
  notes: z.string().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ["endTime"] // Chemin du champ où l'erreur sera affichée
});
  
type BlockTimeFormValues = z.infer<typeof blockTimeSchema>;

interface BlockTimeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BlockTimeFormValues) => Promise<void>;
  defaultValues?: Partial<BlockTimeFormValues>;
}

export function BlockTimeForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: BlockTimeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BlockTimeFormValues>({
    resolver: zodResolver(blockTimeSchema),
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "10:00",
      title: "Absence",
      notes: "",
    },
  });

  const handleSubmit = async (data: BlockTimeFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      toast.success("Plage horaire bloquée avec succès");
    } catch (error: any) {
      console.error("Erreur lors du blocage de la plage horaire:", error);
      
      // Vérifier si l'erreur est un conflit d'horaire
      if (error.status === 409 || error.message?.includes("Conflit d'horaire")) {
        toast.error(error.message || "Ce créneau chevauche un rendez-vous existant ou une plage déjà bloquée. Veuillez choisir un autre horaire.", {
          duration: 5000,
          action: {
            label: "OK",
            onClick: () => {}
          }
        });
      } else {
        toast.error("Erreur lors du blocage de la plage horaire");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bloquer une plage horaire</DialogTitle>
        </DialogHeader>
 
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Date */}
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
 
            {/* Heures */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de début</FormLabel>
                    <FormControl>
                      <Input type="time" step="900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
 
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de fin</FormLabel>
                    <FormControl>
                      <Input type="time" step="900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
 
            {/* Titre */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Absence, Pause déjeuner" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
 
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (facultatif)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes supplémentaires..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
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
                ) : "Bloquer cette plage"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
 }