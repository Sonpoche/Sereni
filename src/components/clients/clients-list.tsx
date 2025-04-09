// src/components/clients/clients-list.tsx
"use client"

import { useState } from "react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { type Client } from "./clients-container"
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Phone, 
  Mail,
  User,
  CalendarX 
} from "lucide-react"

interface ClientsListProps {
  clients: Client[]
  onClientSelect: (clientId: string) => void
  selectedClientId: string | null
}

export function ClientsList({ 
  clients, 
  onClientSelect,
  selectedClientId 
}: ClientsListProps) {
  const [sortBy, setSortBy] = useState<"name" | "email" | "date" | "appointments">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Fonction de tri
  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === "name") {
      return sortDirection === "asc" 
        ? (a.user.name || "").localeCompare(b.user.name || "")
        : (b.user.name || "").localeCompare(a.user.name || "")
    } else if (sortBy === "email") {
      return sortDirection === "asc" 
        ? (a.user.email || "").localeCompare(b.user.email || "")
        : (b.user.email || "").localeCompare(a.user.email || "")
    } else if (sortBy === "appointments") {
      const aCount = a.appointmentsCount || 0
      const bCount = b.appointmentsCount || 0
      return sortDirection === "asc" ? aCount - bCount : bCount - aCount
    } else { // date
      return sortDirection === "asc" 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Gestion du tri
  const handleSort = (column: "name" | "email" | "date" | "appointments") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("desc")
    }
  }

  // Formatage de la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date)
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3" onClick={() => handleSort("name")}>
              <div className="flex items-center cursor-pointer">
                <span>Nom</span>
                {sortBy === "name" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell" onClick={() => handleSort("email")}>
              <div className="flex items-center cursor-pointer">
                <span>Contact</span>
                {sortBy === "email" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="hidden lg:table-cell" onClick={() => handleSort("appointments")}>
              <div className="flex items-center cursor-pointer">
                <span>Rendez-vous</span>
                {sortBy === "appointments" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell text-right" onClick={() => handleSort("date")}>
              <div className="flex items-center justify-end cursor-pointer">
                <span>Ajouté le</span>
                {sortBy === "date" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <User className="h-8 w-8 mb-2 text-gray-300" />
                  <p>Aucun client trouvé</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedClients.map((client) => (
              <TableRow 
                key={client.id} 
                className={
                  client.id === selectedClientId 
                    ? "bg-primary/5 cursor-pointer hover:bg-primary/10"
                    : "cursor-pointer hover:bg-gray-50"
                }
                onClick={() => onClientSelect(client.id)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{client.user.name}</span>
                    <span className="text-sm text-gray-500 md:hidden">{client.user.email}</span>
                    {client.phone && <span className="text-sm text-gray-500 md:hidden">{client.phone}</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{client.user.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {client.appointmentsCount ? (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <span>{client.appointmentsCount}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <CalendarX className="h-4 w-4 mr-2" />
                      <span>Aucun</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right text-sm text-gray-500">
                  {formatDate(client.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}