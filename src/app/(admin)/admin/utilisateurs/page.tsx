// src/app/(admin)/admin/utilisateurs/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  UserCheck,
  Building,
  CreditCard,
  Download
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'
  hasProfile: boolean
  emailVerified: string | null
  createdAt: string
  updatedAt: string
  subscription?: {
    id: string
    plan: 'standard' | 'premium'
    status: string
    mrr: number
  }
  professionalProfile?: {
    id: string
    type: string
    city: string
    servicesCount: number
    bookingsCount: number
  }
  clientProfile?: {
    id: string
    bookingsCount: number
  }
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (roleFilter !== 'all') queryParams.append('role', roleFilter)
      if (statusFilter !== 'all') queryParams.append('status', statusFilter)
      if (searchTerm) queryParams.append('search', searchTerm)

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        // Données de démonstration
        setUsers([
          {
            id: "user_1",
            name: "Marie Dubois",
            email: "marie.dubois@email.com",
            role: "PROFESSIONAL",
            hasProfile: true,
            emailVerified: "2024-01-15T10:30:00Z",
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-20T14:15:00Z",
            subscription: {
              id: "sub_1",
              plan: "premium",
              status: "active",
              mrr: 40
            },
            professionalProfile: {
              id: "prof_1",
              type: "YOGA_TEACHER",
              city: "Paris",
              servicesCount: 5,
              bookingsCount: 23
            }
          },
          {
            id: "user_2",
            name: "Pierre Martin",
            email: "pierre.martin@email.com",
            role: "PROFESSIONAL",
            hasProfile: true,
            emailVerified: "2024-01-18T09:45:00Z",
            createdAt: "2024-01-18T09:45:00Z",
            updatedAt: "2024-01-22T16:20:00Z",
            subscription: {
              id: "sub_2",
              plan: "standard",
              status: "active",
              mrr: 20
            },
            professionalProfile: {
              id: "prof_2",
              type: "PERSONAL_COACH",
              city: "Lyon",
              servicesCount: 3,
              bookingsCount: 12
            }
          },
          {
            id: "user_3",
            name: "Sophie Laurent",
            email: "sophie.laurent@email.com",
            role: "CLIENT",
            hasProfile: true,
            emailVerified: "2024-01-20T14:30:00Z",
            createdAt: "2024-01-20T14:30:00Z",
            updatedAt: "2024-01-21T10:45:00Z",
            clientProfile: {
              id: "client_1",
              bookingsCount: 8
            }
          },
          {
            id: "user_4",
            name: "Jean Dupont",
            email: "jean.dupont@email.com",
            role: "CLIENT",
            hasProfile: false,
            emailVerified: null,
            createdAt: "2024-01-22T11:15:00Z",
            updatedAt: "2024-01-22T11:15:00Z",
            clientProfile: {
              id: "client_2",
              bookingsCount: 0
            }
          },
          {
            id: "user_5",
            name: "Admin SereniBook",
            email: "admin@serenibook.fr",
            role: "ADMIN",
            hasProfile: true,
            emailVerified: "2024-01-01T00:00:00Z",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-23T08:30:00Z"
          }
        ])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
      toast.error("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId))
        toast.success("Utilisateur supprimé avec succès")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleToggleRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole as any } : user
        ))
        toast.success("Rôle mis à jour avec succès")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du rôle")
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Export terminé")
      } else {
        toast.error("Erreur lors de l'export")
      }
    } catch (error) {
      console.error("Erreur export:", error)
      toast.error("Erreur lors de l'export")
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'PROFESSIONAL':
        return <Badge variant="default"><Building className="h-3 w-3 mr-1" />Professionnel</Badge>
      case 'CLIENT':
        return <Badge variant="secondary"><UserCheck className="h-3 w-3 mr-1" />Client</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (user: User) => {
    if (!user.hasProfile) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Profil incomplet</Badge>
    }
    if (!user.emailVerified) {
      return <Badge variant="outline" className="text-red-600 border-red-600">Email non vérifié</Badge>
    }
    return <Badge variant="outline" className="text-green-600 border-green-600">Actif</Badge>
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    total: users.length,
    clients: users.filter(u => u.role === 'CLIENT').length,
    professionals: users.filter(u => u.role === 'PROFESSIONAL').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    incomplete: users.filter(u => !u.hasProfile).length,
    unverified: users.filter(u => !u.emailVerified).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-title font-bold text-gray-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600">
            Gérez tous les utilisateurs de la plateforme SereniBook
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <CreateUserForm onSuccess={() => {
                setShowCreateDialog(false)
                fetchUsers()
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
            <p className="text-xs text-gray-600">Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.professionals}</div>
            <p className="text-xs text-gray-600">Professionnels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <p className="text-xs text-gray-600">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.incomplete}</div>
            <p className="text-xs text-gray-600">Incomplets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.unverified}</div>
            <p className="text-xs text-gray-600">Non vérifiés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Rechercher</Button>
            </form>
            
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="CLIENT">Clients ({stats.clients})</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professionnels ({stats.professionals})</SelectItem>
                  <SelectItem value="ADMIN">Admins ({stats.admins})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="incomplete">Profil incomplet</SelectItem>
                  <SelectItem value="unverified">Email non vérifié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <Badge variant={user.subscription.plan === 'premium' ? 'default' : 'secondary'}>
                            {user.subscription.plan === 'premium' ? 'Premium' : 'Standard'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {user.subscription.mrr}€/mois
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.professionalProfile ? (
                        <div className="text-sm">
                          <div>{user.professionalProfile.servicesCount} services</div>
                          <div className="text-gray-500">{user.professionalProfile.bookingsCount} RDV</div>
                        </div>
                      ) : user.clientProfile ? (
                        <div className="text-sm">
                          <div>{user.clientProfile.bookingsCount} réservations</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/utilisateurs/${user.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {user.role !== 'ADMIN' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer l'utilisateur {user.name} ? 
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur - {selectedUser.name}</DialogTitle>
            </DialogHeader>
            <EditUserForm 
              user={selectedUser}
              onSuccess={() => {
                setSelectedUser(null)
                fetchUsers()
              }}
              onRoleChange={handleToggleRole}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Composant formulaire de création
interface CreateUserFormProps {
  onSuccess: () => void
}

function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CLIENT' as const,
    sendWelcomeEmail: true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Utilisateur créé avec succès")
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la création")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nom complet</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Rôle</label>
        <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="PROFESSIONAL">Professionnel</SelectItem>
            <SelectItem value="ADMIN">Administrateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sendWelcomeEmail"
          checked={formData.sendWelcomeEmail}
          onChange={(e) => setFormData(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
        />
        <label htmlFor="sendWelcomeEmail" className="text-sm">
          Envoyer un email de bienvenue
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </Button>
      </div>
    </form>
  )
}Création...' : 'Créer l\'utilisateur'}
        </Button>
      </div>
    </form>
  )
}

// Composant formulaire de modification
interface EditUserFormProps {
  user: User
  onSuccess: () => void
  onRoleChange: (userId: string, newRole: string) => void
}

function EditUserForm({ user, onSuccess, onRoleChange }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    hasProfile: user.hasProfile,
    emailVerified: !!user.emailVerified
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Utilisateur mis à jour avec succès")
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom complet</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Rôle</label>
        <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="PROFESSIONAL">Professionnel</SelectItem>
            <SelectItem value="ADMIN">Administrateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasProfile"
            checked={formData.hasProfile}
            onChange={(e) => setFormData(prev => ({ ...prev, hasProfile: e.target.checked }))}
          />
          <label htmlFor="hasProfile" className="text-sm">
            Profil complété
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emailVerified"
            checked={formData.emailVerified}
            onChange={(e) => setFormData(prev => ({ ...prev, emailVerified: e.target.checked }))}
          />
          <label htmlFor="emailVerified" className="text-sm">
            Email vérifié
          </label>
        </div>
      </div>

      {/* Informations en lecture seule */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">Informations</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Inscription :</span>
            <div>{format(new Date(user.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</div>
          </div>
          <div>
            <span className="text-gray-500">Dernière modification :</span>
            <div>{format(new Date(user.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? '