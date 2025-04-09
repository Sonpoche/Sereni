// src/components/clients/clients-container.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ClientsList } from "./clients-list"
import { ClientDetails } from "./client-details"
import { AddClientButton } from "./add-client-button"
import { PageHeader } from "@/components/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, UserPlus, FilterX } from "lucide-react"
import { toast } from "sonner"

export interface Client {
  id: string
  user: {
    name: string
    email: string
  }
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  notes?: string
  createdAt: string
  appointmentsCount?: number
  lastAppointment?: string
}

export default function ClientsContainer() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("tous")

  // Fonction pour charger les clients
  const loadClients = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${session.user.id}/clients`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des clients")
      }
      
      const data = await response.json()
      setClients(data)
      setFilteredClients(data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des clients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [session?.user?.id])

  // Filtrage des clients en fonction de la recherche
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = clients.filter(client => 
        client.user.name?.toLowerCase().includes(query) || 
        client.user.email?.toLowerCase().includes(query) || 
        client.phone?.toLowerCase().includes(query)
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clients)
    }
  }, [searchQuery, clients])

  // Filtre par onglet
  useEffect(() => {
    if (activeTab === "tous") {
      // Ne filtrer que par la recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const filtered = clients.filter(client => 
          client.user.name?.toLowerCase().includes(query) || 
          client.user.email?.toLowerCase().includes(query) || 
          client.phone?.toLowerCase().includes(query)
        )
        setFilteredClients(filtered)
      } else {
        setFilteredClients(clients)
      }
    } else if (activeTab === "recents") {
      // Clients avec rendez-vous récents (dans les 30 derniers jours)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const filtered = clients.filter(client => 
        client.lastAppointment && new Date(client.lastAppointment) >= thirtyDaysAgo
      )
      
      // Appliquer également le filtre de recherche si nécessaire
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchFiltered = filtered.filter(client => 
          client.user.name?.toLowerCase().includes(query) || 
          client.user.email?.toLowerCase().includes(query) || 
          client.phone?.toLowerCase().includes(query)
        )
        setFilteredClients(searchFiltered)
      } else {
        setFilteredClients(filtered)
      }
    } else if (activeTab === "sans-rdv") {
      // Clients sans rendez-vous
      const filtered = clients.filter(client => 
        !client.appointmentsCount || client.appointmentsCount === 0
      )
      
      // Appliquer également le filtre de recherche si nécessaire
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchFiltered = filtered.filter(client => 
          client.user.name?.toLowerCase().includes(query) || 
          client.user.email?.toLowerCase().includes(query) || 
          client.phone?.toLowerCase().includes(query)
        )
        setFilteredClients(searchFiltered)
      } else {
        setFilteredClients(filtered)
      }
    }
  }, [activeTab, clients, searchQuery])

  // Gestion de la sélection d'un client
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
  }

  // Gestion de l'ajout d'un client
  const handleClientAdded = (client: Client) => {
    setClients(prev => [client, ...prev])
    toast.success("Client ajouté avec succès")
  }

  // Gestion de la mise à jour d'un client
  const handleClientUpdated = (updatedClient: Client) => {
    setClients(prev => 
      prev.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    )
    toast.success("Client mis à jour avec succès")
  }

  // Gestion de la suppression d'un client
  const handleClientDeleted = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId))
    setSelectedClientId(null)
    toast.success("Client supprimé avec succès")
  }

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery("")
    setActiveTab("tous")
    setFilteredClients(clients)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des clients"
        description="Consultez, ajoutez et gérez vos clients"
      >
        <AddClientButton onClientAdded={handleClientAdded} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {(searchQuery || activeTab !== "tous") && (
              <Button
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
                onClick={resetFilters}
              >
                <FilterX className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Onglets de filtrage */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="tous">Tous les clients</TabsTrigger>
              <TabsTrigger value="recents">Clients récents</TabsTrigger>
              <TabsTrigger value="sans-rdv">Sans rendez-vous</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Liste des clients */}
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ClientsList 
              clients={filteredClients} 
              onClientSelect={handleClientSelect}
              selectedClientId={selectedClientId}
            />
          )}
        </div>

        {/* Volet de détails du client (visible uniquement si un client est sélectionné) */}
        <div className="lg:col-span-1">
          {selectedClientId ? (
            <ClientDetails 
              clientId={selectedClientId}
              onClientUpdated={handleClientUpdated}
              onClientDeleted={handleClientDeleted}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
              <UserPlus className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun client sélectionné</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Sélectionnez un client dans la liste pour voir ses détails ou ajouter un nouveau client.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}