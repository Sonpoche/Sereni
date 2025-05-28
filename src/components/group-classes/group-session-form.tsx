// src/components/group-classes/group-session-form.tsx
"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addMinutes, format } from "date-fns"

const sessionSchema = z.object({
  date: z.string().min(1, "Date requise"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  notes: z.string().optional(),
})

export type SessionFormData = z.infer<typeof sessionSchema>

interface GroupSessionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SessionFormData) => Promise<void>
  onCancel: () => void
  groupClass: {
    id: string
    name: string
    duration: number
  }
}

export function GroupSessionForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onCancel, 
  groupClass 
}: GroupSessionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: "10:00",
      notes: "",
    },
  })

  const startTime = form.watch("startTime")
  const endTime = startTime ? format(
    addMinutes(new Date(`2000-01-01T${startTime}:00`), groupClass.duration), 
    'HH:mm'
  ) : ""

  const handleSubmit = async (data: SessionFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      form.reset()
    } catch (error) {
      // L'erreur sera gérée par le composant parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle séance</DialogTitle>
          <DialogDescription>
            Programmez une nouvelle séance pour "{groupClass.name}"
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
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
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {endTime && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                Durée : {groupClass.duration} minutes (fin à {endTime})
              </div>
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notes spécifiques pour cette séance..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer la séance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}