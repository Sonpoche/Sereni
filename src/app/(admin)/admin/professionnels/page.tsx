// src/app/(admin)/admin/professionnels/page.tsx

"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter,
  MoreVertical,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Activity,
  UserCheck,
  UserX,
  Shield,
  Eye,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@prisma/client'

interface Professional {
  id: string
  name: string
  email: string
  avatar?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  professional: {
    type: string
    businessName?: string
    phone?: string
    city?: string
    subscriptionTier: 'standard' | 'premium'
    stripeCustomerId?: string
    servicesCount: number
    services: Array<{
      id: string
      name: string
      price: number
    }>
  }
  metrics: {
    totalClients: number
    totalBookings: number
    monthlyRevenue: number
    monthlyBookings: number
    conversionRate: number
    isProfileComplete: boolean
  }
}

interface Stats {
  overview: {
    totalProfessionals: number
    activeProfessionals: number
    newThisMonth: number
    growthRate: number
    activationRate: number
    completionRate: number
  }
  distribution: {
    byType: Array<{ type: string; count: number; percentage: number }>
    bySubscription: Array<{ tier: string; count: number; percentage: number }>
  }
  performance: {
    totalRevenue30Days: number
    averageRevenuePerProfessional: number
    topPerformers: Array<{
      id: string
      name: string
      email: string
      type: string
      total_bookings?: number | undefined
      total_revenue?: number | undefined
    }>
  }
  alerts: {
    incompleteProfiles: number
    inactiveProfessionals: number
    lowEngagement: number
  }
}

const STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente'
}

const SUBSCRIPTION_LABELS = {
  standard: 'Standard',
  premium: 'Premium'
}

export default function ProfessionalsAdminPage() {
  const [activeTab, setActiveTab] = useState('vue-ensemble')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSubscription, setSelectedSubscription] = useState<string>('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fonction utilitaire pour obtenir le libellé du type professionnel
  const getProfessionalTypeLabel = (dbType: string): string => {
    const typeMap: Record<string, string> = {
      'LIFE_COACH': 'Coach de vie',
      'PERSONAL_COACH': 'Coach sportif', 
      'YOGA_TEACHER': 'Professeur de yoga',
      'PILATES_INSTRUCTOR': 'Professeur de pilates',
      'THERAPIST': 'Thérapeute',
      'MASSAGE_THERAPIST': 'Praticien en massage',
      'MEDITATION_TEACHER': 'Professeur de méditation',
      'OTHER': 'Autre'
    }
    
    return typeMap[dbType] || 'Professionnel du bien-être'
  }

  // Types disponibles pour les filtres
  const professionalTypes = [
    { key: 'LIFE_COACH', label: 'Coach de vie' },
    { key: 'PERSONAL_COACH', label: 'Coach sportif' },
    { key: 'YOGA_TEACHER', label: 'Professeur de yoga' },
    { key: 'PILATES_INSTRUCTOR', label: 'Professeur de pilates' },
    { key: 'THERAPIST', label: 'Thérapeute' },
    { key: 'MASSAGE_THERAPIST', label: 'Praticien en massage' },
    { key: 'MEDITATION_TEACHER', label: 'Professeur de méditation' },
    { key: 'OTHER', label: 'Autre' }
  ]

  // Chargement des statistiques - CORRIGÉ
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/professionnels/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
        toast.error('Erreur lors du chargement des statistiques')
      }
    }

    fetchStats()
  }, [])

  // Chargement des professionnels avec filtres - CORRIGÉ
  useEffect(() => {
    const fetchProfessionals = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          sortBy,
          sortOrder,
          ...(searchTerm && { search: searchTerm }),
          ...(selectedType !== 'all' && { type: selectedType }),
          ...(selectedStatus !== 'all' && { status: selectedStatus }),
          ...(selectedSubscription !== 'all' && { subscriptionTier: selectedSubscription })
        })

        const response = await fetch(`/api/admin/professionnels?${params}`)
        if (response.ok) {
          const data = await response.json()
          setProfessionals(data.professionals)
          setTotalPages(data.pagination.totalPages)
        } else {
          toast.error('Erreur lors du chargement des professionnels')
        }
      } catch (error) {
        console.error('Erreur:', error)
        toast.error('Erreur lors du chargement des professionnels')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfessionals()
  }, [currentPage, sortBy, sortOrder, searchTerm, selectedType, selectedStatus, selectedSubscription])

  // Actions administratives - CORRIGÉ
  const handleAdminAction = async (professionalId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/professionnels/${professionalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        
        // Recharger les données
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('Erreur lors de l\'action admin:', error)
      toast.error('Erreur lors de l\'action')
    }
  }

  // Filtrage et tri des professionnels côté client
  const filteredProfessionals = useMemo(() => {
    return professionals.filter(professional => {
      const matchesSearch = !searchTerm || 
        professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.professional.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [professionals, searchTerm])

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des Professionnels</h1>
          <p className="text-gray-600">Supervision et administration des comptes professionnels</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {stats?.overview.activeProfessionals || 0} actifs
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vue-ensemble" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="gestion" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Gestion</span>
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="vue-ensemble" className="space-y-6">
          {stats && (
            <>
              {/* Métriques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Professionnels</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.overview.totalProfessionals}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.overview.newThisMonth} ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taux d'Activation</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.overview.activationRate.toFixed(1)}%
                    </div>
                    <Progress value={stats.overview.activationRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profils Complets</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.overview.completionRate.toFixed(1)}%
                    </div>
                    <Progress value={stats.overview.completionRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus 30j</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.performance.totalRevenue30Days.toLocaleString()}€
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.performance.averageRevenuePerProfessional.toFixed(0)}€ moy./pro
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Alertes */}
              {(stats.alerts.incompleteProfiles > 0 || stats.alerts.inactiveProfessionals > 0) && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Alertes à traiter</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.alerts.incompleteProfiles > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-orange-700">
                          {stats.alerts.incompleteProfiles} profils incomplets
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('gestion')
                            setSelectedStatus('pending')
                          }}
                        >
                          Voir
                        </Button>
                      </div>
                    )}
                    {stats.alerts.inactiveProfessionals > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-orange-700">
                          {stats.alerts.inactiveProfessionals} comptes inactifs
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('gestion')
                            setSelectedStatus('inactive')
                          }}
                        >
                          Voir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Top performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Top Performers (30j)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.performance.topPerformers.slice(0, 5).map((performer, index) => (
                      <div key={performer.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.name}</p>
                            <p className="text-sm text-gray-600">
                              {getProfessionalTypeLabel(performer.type)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Math.round(performer.total_revenue ?? 0)}€</p>
                          <p className="text-sm text-gray-600">
                            {performer.total_bookings ?? 0} RDV
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution par type */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.distribution.byType.map(item => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="text-sm">
                          {getProfessionalTypeLabel(item.type)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20">
                            <Progress value={item.percentage} className="h-2" />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribution par abonnement */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.distribution.bySubscription.map(item => (
                      <div key={item.tier} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {SUBSCRIPTION_LABELS[item.tier as keyof typeof SUBSCRIPTION_LABELS]}
                          </span>
                          <Badge variant={item.tier === 'premium' ? 'default' : 'secondary'} className="text-xs">
                            {item.tier === 'premium' ? '40€' : '20€'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20">
                            <Progress value={item.percentage} className="h-2" />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Gestion */}
        <TabsContent value="gestion" className="space-y-6">
          {/* Filtres et recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par nom, email ou entreprise..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {professionalTypes.map(type => (
                        <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {Object.entries(SUBSCRIPTION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des professionnels */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Professionnel
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Plan
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Métriques
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Statut
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredProfessionals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          Aucun professionnel trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredProfessionals.map((professional) => (
                        <tr key={professional.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={professional.avatar} />
                                <AvatarFallback>
                                  {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {professional.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {professional.email}
                                </p>
                                {professional.professional.businessName && (
                                  <p className="text-xs text-gray-500">
                                    {professional.professional.businessName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm">
                              {getProfessionalTypeLabel(professional.professional.type)}
                            </span>
                            {professional.professional.city && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {professional.professional.city}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <Badge 
                              variant={
                                professional.professional.subscriptionTier === 'premium' 
                                  ? 'default' 
                                  : 'secondary'
                              }
                            >
                              {SUBSCRIPTION_LABELS[professional.professional.subscriptionTier]}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Users className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{professional.metrics.totalClients || 0} clients</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Euro className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{Math.round(professional.metrics.monthlyRevenue || 0)}€/mois</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{professional.metrics.totalBookings || 0} RDV</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-2">
                              <Badge 
                                variant={professional.isActive ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {professional.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                              {!professional.metrics.isProfileComplete && (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  Profil incomplet
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {professional.isActive ? (
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleAdminAction(professional.id, 'deactivate')}
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => handleAdminAction(professional.id, 'activate')}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activer
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleAdminAction(professional.id, 'suspend')}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Suspendre
                                </DropdownMenuItem>
                                {!professional.metrics.isProfileComplete && (
                                  <DropdownMenuItem 
                                    className="text-blue-600"
                                    onClick={() => handleAdminAction(professional.id, 'validate')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Valider profil
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Ajouter note
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <div className="flex items-center text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}