// src/components/invoices/invoice-details.tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Send, 
  Edit, 
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Euro,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  totalAmount: number
  taxRate: number
  taxAmount: number
  paymentDate?: string
  paymentMethod?: string
  paymentRef?: string
  notes?: string
  client: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
  }
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  createdAt: string
  updatedAt: string
}

interface InvoiceDetailsProps {
  invoice: Invoice
  onClose: () => void
  onEdit: () => void
  onDownload: () => void
  onSend: () => void
}

const statusConfig = {
  draft: { 
    label: 'Brouillon', 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: Edit,
    description: 'Cette facture est en cours de rédaction'
  },
  sent: { 
    label: 'Envoyée', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: Send,
    description: 'Cette facture a été envoyée au client'
  },
  paid: { 
    label: 'Payée', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    description: 'Cette facture a été payée'
  },
  overdue: { 
    label: 'En retard', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: Clock,
    description: 'Cette facture est en retard de paiement'
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-gray-100 text-gray-500 border-gray-200', 
    icon: XCircle,
    description: 'Cette facture a été annulée'
  },
}

export function InvoiceDetails({ 
  invoice, 
  onClose, 
  onEdit, 
  onDownload, 
  onSend 
}: InvoiceDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const statusInfo = statusConfig[invoice.status]
  const StatusIcon = statusInfo.icon
  
  // Calculer le sous-total HT
  const subtotalHT = invoice.totalAmount - invoice.taxAmount

  // Calculer les jours jusqu'à l'échéance
  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const isDueToday = daysUntilDue === 0
  const isOverdue = daysUntilDue < 0
  const isDueSoon = daysUntilDue > 0 && daysUntilDue <= 7

  const handleAction = async (action: () => void) => {
    setIsLoading(true)
    try {
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              Facture {invoice.number}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={statusInfo.color} variant="secondary">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Détails facture */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails de la facture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date de création</p>
                    <p className="font-medium">
                      {new Date(invoice.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date d'échéance</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                      {isDueToday && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Échue aujourd'hui
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive">
                          En retard ({Math.abs(daysUntilDue)} jours)
                        </Badge>
                      )}
                      {isDueSoon && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Échue dans {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="font-bold text-lg text-primary">
                      {invoice.totalAmount.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {invoice.paymentDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Date de paiement</p>
                      <p className="font-medium text-green-600">
                        {new Date(invoice.paymentDate).toLocaleDateString('fr-FR')}
                      </p>
                      {invoice.paymentMethod && (
                        <p className="text-sm text-gray-600">
                          via {invoice.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Statut</p>
                  <p className="text-sm">{statusInfo.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Informations client */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="font-medium">{invoice.client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{invoice.client.email}</p>
                  </div>
                </div>

                {invoice.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{invoice.client.phone}</p>
                    </div>
                  </div>
                )}

                {invoice.client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <div className="font-medium">
                        <p>{invoice.client.address}</p>
                        {invoice.client.postalCode && invoice.client.city && (
                          <p>{invoice.client.postalCode} {invoice.client.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Éléments de facturation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Éléments facturés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Description</th>
                      <th className="text-center py-3 px-2 w-20">Qté</th>
                      <th className="text-right py-3 px-2 w-24">Prix unitaire</th>
                      <th className="text-right py-3 px-2 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={item.id} className={index > 0 ? "border-t" : ""}>
                        <td className="py-3 px-2">
                          <p className="font-medium">{item.description}</p>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {item.unitPrice.toFixed(2)} €
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {item.totalPrice.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Totaux */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total HT :</span>
                  <span className="font-medium">{subtotalHT.toFixed(2)} €</span>
                </div>
                
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span>TVA ({invoice.taxRate}%) :</span>
                    <span className="font-medium">{invoice.taxAmount.toFixed(2)} €</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC :</span>
                  <span>{invoice.totalAmount.toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleAction(onDownload)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
              
              {invoice.status !== 'paid' && (
                <Button 
                  variant="outline" 
                  onClick={() => handleAction(onSend)}
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer par email
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              
              {invoice.status !== 'paid' && (
                <Button onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}