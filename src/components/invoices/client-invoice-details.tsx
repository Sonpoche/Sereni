// src/components/invoices/client-invoice-details.tsx
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
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building
} from "lucide-react"

interface ClientInvoice {
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
  notes?: string
  professional: {
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

interface ClientInvoiceDetailsProps {
  invoice: ClientInvoice
  onClose: () => void
  onDownload: () => void
}

const statusConfig = {
  draft: { 
    label: 'Brouillon', 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: FileText,
    description: 'Cette facture est encore en cours de rédaction'
  },
  sent: { 
    label: 'Reçue', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: FileText,
    description: 'Cette facture vous a été envoyée'
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
    icon: AlertTriangle,
    description: 'Cette facture est en retard de paiement'
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-gray-100 text-gray-500 border-gray-200', 
    icon: XCircle,
    description: 'Cette facture a été annulée'
  },
}

export function ClientInvoiceDetails({ 
  invoice, 
  onClose, 
  onDownload 
}: ClientInvoiceDetailsProps) {
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

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      await onDownload()
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
          {/* Alertes selon le statut */}
          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Facture en retard</p>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Cette facture est en retard de {Math.abs(daysUntilDue)} jours. 
                Contactez {invoice.professional.name} pour régler la situation.
              </p>
            </div>
          )}

          {isDueSoon && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Clock className="h-5 w-5" />
                <p className="font-medium">Échéance proche</p>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                Cette facture doit être payée dans {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''}.
              </p>
            </div>
          )}

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
                    <p className="text-sm text-gray-600">Date d'émission</p>
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
                          En retard
                        </Badge>
                      )}
                      {isDueSoon && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Bientôt échue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Montant à payer</p>
                    <p className="font-bold text-xl text-primary">
                      {invoice.totalAmount.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {invoice.paymentDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Payée le</p>
                      <p className="font-medium text-green-600">
                        {new Date(invoice.paymentDate).toLocaleDateString('fr-FR')}
                      </p>
                      {invoice.paymentMethod && (
                        <p className="text-sm text-gray-600">
                          Méthode : {invoice.paymentMethod}
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

            {/* Informations professionnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professionnel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="font-medium">{invoice.professional.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">
                      <a 
                        href={`mailto:${invoice.professional.email}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.professional.email}
                      </a>
                    </p>
                  </div>
                </div>

                {invoice.professional.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">
                        <a 
                          href={`tel:${invoice.professional.phone}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.professional.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {invoice.professional.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <div className="font-medium">
                        <p>{invoice.professional.address}</p>
                        {invoice.professional.postalCode && invoice.professional.city && (
                          <p>{invoice.professional.postalCode} {invoice.professional.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(isOverdue || isDueSoon) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Besoin d'aide ?
                    </p>
                    <p className="text-sm text-blue-700">
                      Contactez directement {invoice.professional.name} pour toute question 
                      concernant cette facture ou les modalités de paiement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Détail des prestations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détail des prestations</CardTitle>
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
                  <span className="text-primary">{invoice.totalAmount.toFixed(2)} €</span>
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
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">
              Facture émise le {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              
              <Button 
                onClick={handleDownload}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isLoading ? "Téléchargement..." : "Télécharger PDF"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}