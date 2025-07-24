// src/app/(dashboard)/mes-factures/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Download, 
  Eye, 
  FileText,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { ClientInvoiceDetails } from "@/components/invoices/client-invoice-details"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Reçue', color: 'bg-blue-100 text-blue-800', icon: Eye },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-800', icon: Clock },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

export default function MesFacturesPage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<ClientInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Charger les factures
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/clients/${session.user.id}/invoices`)
        if (response.ok) {
          const data = await response.json()
          setInvoices(data)
          setFilteredInvoices(data)
        } else {
          const error = await response.json()
          throw new Error(error.error)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des factures:", error)
        toast.error("Erreur lors du chargement des factures")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [session?.user?.id])

  // Filtrer les factures
  useEffect(() => {
    let filtered = invoices

    // Filtrer par statut
    if (selectedStatus !== "all") {
      filtered = filtered.filter(invoice => invoice.status === selectedStatus)
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.number.toLowerCase().includes(query) ||
        invoice.professional.name.toLowerCase().includes(query)
      )
    }

    setFilteredInvoices(filtered)
  }, [invoices, selectedStatus, searchQuery])

  // Calculer les statistiques
  const stats = {
    total: invoices.length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0),
    unpaidAmount: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.totalAmount, 0)
  }

  // Télécharger le PDF
  const handleDownloadPDF = async (invoice: ClientInvoice) => {
    try {
      const response = await fetch(`/api/clients/${session?.user?.id}/invoices/${invoice.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `facture-${invoice.number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Facture téléchargée")
      } else {
        throw new Error("Erreur lors du téléchargement")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Mes factures
        </h1>
        <p className="text-gray-600 mt-1">
          Consultez et téléchargez vos factures
        </p>
      </div>

      {/* Information importante */}
      {stats.overdue > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Vous avez {stats.overdue} facture{stats.overdue > 1 ? 's' : ''} en retard de paiement. 
            Contactez directement votre professionnel pour régler la situation.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total factures</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payées</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
                <p className="text-xs text-gray-500">{stats.paidAmount.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Euro className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">À payer</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unpaidAmount.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par numéro ou professionnel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="sent">Reçues</TabsTrigger>
                <TabsTrigger value="paid">Payées</TabsTrigger>
                <TabsTrigger value="overdue">En retard</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <Card>
        <CardHeader>
          <CardTitle>Factures ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {searchQuery || selectedStatus !== "all" 
                  ? "Aucune facture ne correspond aux critères" 
                  : "Aucune facture reçue"
                }
              </p>
              {!searchQuery && selectedStatus === "all" && (
                <p className="text-sm text-gray-500">
                  Vos factures apparaîtront ici lorsque les professionnels vous en enverront.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status].icon
                const daysUntilDue = Math.ceil(
                  (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                const isOverdue = daysUntilDue < 0
                const isDueSoon = daysUntilDue > 0 && daysUntilDue <= 7

                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(invoice.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{invoice.professional.name}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                          {isOverdue && (
                            <span className="text-red-600 font-medium ml-2">
                              (En retard de {Math.abs(daysUntilDue)} jours)
                            </span>
                          )}
                          {isDueSoon && (
                            <span className="text-orange-600 font-medium ml-2">
                              (Échue dans {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg">{invoice.totalAmount.toFixed(2)} €</p>
                        <Badge className={statusConfig[invoice.status].color} variant="secondary">
                          {statusConfig[invoice.status].label}
                        </Badge>
                        {invoice.paymentDate && (
                          <p className="text-xs text-green-600 mt-1">
                            Payée le {new Date(invoice.paymentDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setIsDetailsOpen(true)
                        }}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadPDF(invoice)}
                        title="Télécharger le PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {isDetailsOpen && selectedInvoice && (
        <ClientInvoiceDetails
          invoice={selectedInvoice}
          onClose={() => {
            setIsDetailsOpen(false)
            setSelectedInvoice(null)
          }}
          onDownload={() => handleDownloadPDF(selectedInvoice)}
        />
      )}
    </div>
  )
}