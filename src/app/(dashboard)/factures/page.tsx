// src/app/(dashboard)/factures/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Download, 
  Send, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  FileText,
  Euro,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { InvoiceDetails } from "@/components/invoices/invoice-details"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: Edit },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-800', icon: Send },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-800', icon: Clock },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

export default function FacturesPage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Charger les factures
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/invoices`)
        if (response.ok) {
          const data = await response.json()
          setInvoices(data)
          setFilteredInvoices(data)
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
        invoice.client.name.toLowerCase().includes(query) ||
        invoice.client.email.toLowerCase().includes(query)
      )
    }

    setFilteredInvoices(filtered)
  }, [invoices, selectedStatus, searchQuery])

  // Calculer les statistiques
  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0)
  }

  // Gérer la création/modification d'une facture
  const handleInvoiceSubmit = async (data: any) => {
    try {
      const url = selectedInvoice 
        ? `/api/users/${session?.user?.id}/invoices/${selectedInvoice.id}`
        : `/api/users/${session?.user?.id}/invoices`
      
      const method = selectedInvoice ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const newInvoice = await response.json()
        
        if (selectedInvoice) {
          setInvoices(prev => prev.map(inv => 
            inv.id === selectedInvoice.id ? newInvoice : inv
          ))
          toast.success("Facture modifiée avec succès")
        } else {
          setInvoices(prev => [newInvoice, ...prev])
          toast.success("Facture créée avec succès")
        }
        
        setIsFormOpen(false)
        setSelectedInvoice(null)
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  // Télécharger le PDF
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/invoices/${invoice.id}/pdf`)
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
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  // Envoyer par email
  const handleSendEmail = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendCopy: true })
      })

      if (response.ok) {
        // Mettre à jour le statut local
        setInvoices(prev => prev.map(inv => 
          inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
        ))
        toast.success("Facture envoyée avec succès")
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'envoi")
    }
  }

  // Supprimer une facture
  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.number} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${session?.user?.id}/invoices/${invoice.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInvoices(prev => prev.filter(inv => inv.id !== invoice.id))
        toast.success("Facture supprimée avec succès")
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-title font-bold text-gray-900">
            Facturation
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos factures et suivez vos paiements
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

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
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="text-2xl font-bold">{stats.totalAmount.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payées</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
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
                <p className="text-2xl font-bold">{stats.overdue}</p>
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
                  placeholder="Rechercher par numéro, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="draft">Brouillons</TabsTrigger>
                <TabsTrigger value="sent">Envoyées</TabsTrigger>
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
                  : "Aucune facture créée"
                }
              </p>
              {!searchQuery && selectedStatus === "all" && (
                <Button onClick={() => setIsFormOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre première facture
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status].icon
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium">{invoice.client.name}</p>
                        <p className="text-sm text-gray-600">{invoice.client.email}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{invoice.totalAmount.toFixed(2)} €</p>
                        <Badge className={statusConfig[invoice.status].color} variant="secondary">
                          {statusConfig[invoice.status].label}
                        </Badge>
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleSendEmail(invoice)}>
                              <Send className="h-4 w-4 mr-2" />
                              Envoyer par email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setIsFormOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {isFormOpen && (
        <InvoiceForm
          invoice={selectedInvoice}
          onSubmit={handleInvoiceSubmit}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedInvoice(null)
          }}
        />
      )}
      
      {isDetailsOpen && selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          onClose={() => {
            setIsDetailsOpen(false)
            setSelectedInvoice(null)
          }}
          onEdit={() => {
            setIsDetailsOpen(false)
            setIsFormOpen(true)
          }}
          onDownload={() => handleDownloadPDF(selectedInvoice)}
          onSend={() => handleSendEmail(selectedInvoice)}
        />
      )}
    </div>
  )
}