// src/components/invoices/invoice-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Calculator } from "lucide-react"
import { toast } from "sonner"

// Schema de validation
const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Veuillez sélectionner un client"),
  dueDate: z.string().min(1, "Veuillez sélectionner une date d'échéance"),
  taxRate: z.number().min(0).max(100),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description requise"),
    quantity: z.number().min(1, "Quantité minimum: 1"),
    unitPrice: z.number().min(0.01, "Prix minimum: 0.01€"),
  })).min(1, "Au moins un élément requis"),
})

type InvoiceFormData = z.infer<typeof invoiceFormSchema>

interface Client {
  id: string
  user: {
    name: string | null
    email: string | null
  }
  phone?: string | null
}

interface InvoiceFormProps {
  invoice?: any | null
  onSubmit: (data: InvoiceFormData) => Promise<void>
  onClose: () => void
}

export function InvoiceForm({ invoice, onSubmit, onClose }: InvoiceFormProps) {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Configuration du formulaire
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: invoice?.client?.id || "",
      dueDate: invoice?.dueDate ? 
        new Date(invoice.dueDate).toISOString().split('T')[0] : 
        (() => {
          const date = new Date()
          date.setDate(date.getDate() + 30) // 30 jours par défaut
          return date.toISOString().split('T')[0]
        })(),
      taxRate: invoice?.taxRate || 20,
      notes: invoice?.notes || "",
      items: invoice?.items || [
        { description: "", quantity: 1, unitPrice: 0 }
      ],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  // Charger les clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${session.user.id}/clients`)
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error)
        toast.error("Erreur lors du chargement des clients")
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [session?.user?.id])

  // Calculer les totaux
  const watchedItems = form.watch("items")
  const watchedTaxRate = form.watch("taxRate")

  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  const taxAmount = (subtotal * watchedTaxRate) / 100
  const total = subtotal + taxAmount

  // Gestion de la soumission
  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      // L'erreur est gérée dans le composant parent
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ajouter un élément vide
  const addItem = () => {
    append({ description: "", quantity: 1, unitPrice: 0 })
  }

  // Supprimer un élément
  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Modifier la facture" : "Nouvelle facture"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.user.name} ({client.user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'échéance *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Éléments de facturation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Éléments de facturation</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Description du service ou produit"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1"
                                step="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prix unitaire *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Total</div>
                      <div className="font-medium">
                        {(watchedItems[index]?.quantity * watchedItems[index]?.unitPrice || 0).toFixed(2)} €
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TVA et totaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de TVA (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormItem className="mt-4">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes ou commentaires..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sous-total HT :</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                  </div>
                  {watchedTaxRate > 0 && (
                    <div className="flex justify-between">
                      <span>TVA ({watchedTaxRate}%) :</span>
                      <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total TTC :</span>
                      <span>{total.toFixed(2)} €</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : invoice ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}