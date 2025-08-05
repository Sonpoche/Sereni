// src/app/(admin)/admin/abonnements/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Download,
  Mail,
  Phone,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { SubscriptionMetricsChart } from "@/components/admin/subscription-metrics-chart"
import { getProfessionalTypeLabel } from "@/types/professional"

interface SubscriptionData {
  id: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid' | 'trialing'
  plan: 'standard' | 'premium'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  mrr: number
  user: {
    id: string
    name: string
    email: string
    professionalType?: string
    createdAt: string
  }
  payments: {
    total: number
    failed: number
    lastPayment?: string
    nextPayment?: string
  }
  metrics: {
    totalRevenue: number
    monthsActive: number
    ltv: number
  }
}

interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  canceledSubscriptions: number
  totalMRR: number
  mrrGrowth: number
  churnRate: number
  averageLTV: number
  failedPayments: number
}

interface SubscriptionDetailsProps {
  subscription: SubscriptionData
  onChangePlan: (subscriptionId: string, newPlan: 'standard' | 'premium') => void
  onCancel: (subscriptionId: string, immediately?: boolean) => void
  onReactivate: (subscriptionId: string) => void
  onRetryPayment: (subscriptionId: string) => void
  isProcessing: boolean
}

export default function AbonnementsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'canceled'>('all')
  const [planFilter, setPlanFilter] = useState<'all' | 'standard' | 'premium'>('all')
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchSubscriptions()
    fetchStats()
  }, [statusFilter, planFilter, searchTerm])

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(planFilter !== 'all' && { plan: planFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      } else {
        // Données de démonstration
        setSubscriptions([
          {
            id: "sub_1",
            stripeSubscriptionId: "sub_1234567890",
            stripeCustomerId: "cus_1234567890",
            status: "active",
            plan: "premium",
            currentPeriodStart: "2025-01-01T00:00:00Z",
            currentPeriodEnd: "2025-02-01T00:00:00Z",
            cancelAtPeriodEnd: false,
            mrr: 40,
            user: {
              id: "user_1",
              name: "Marie Dubois",
              email: "marie.dubois@email.com",
              professionalType: "COACH_VIE",
              createdAt: "2024-12-15T10:00:00Z"
            },
            payments: {
              total: 3,
              failed: 0,
              lastPayment: "2025-01-01T00:00:00Z",
              nextPayment: "2025-02-01T00:00:00Z"
            },
            metrics: {
              totalRevenue: 120,
              monthsActive: 3,
              ltv: 320
            }
          },
          {
            id: "sub_2",
            stripeSubscriptionId: "sub_0987654321",
            stripeCustomerId: "cus_0987654321",
            status: "past_due",
            plan: "standard",
            currentPeriodStart: "2025-01-15T00:00:00Z",
            currentPeriodEnd: "2025-02-15T00:00:00Z",
            cancelAtPeriodEnd: false,
            mrr: 20,
            user: {
              id: "user_2",
              name: "Pierre Martin",
              email: "pierre.martin@email.com",
              professionalType: "PROF_YOGA",
              createdAt: "2024-11-20T14:30:00Z"
            },
            payments: {
              total: 2,
              failed: 1,
              lastPayment: "2024-12-15T00:00:00Z",
              nextPayment: "2025-01-15T00:00:00Z"
            },
            metrics: {
              totalRevenue: 40,
              monthsActive: 2,
              ltv: 180
            }
          },
          {
            id: "sub_3",
            stripeSubscriptionId: "sub_1122334455",
            stripeCustomerId: "cus_1122334455",
            status: "active",
            plan: "premium",
            currentPeriodStart: "2025-01-10T00:00:00Z",
            currentPeriodEnd: "2025-02-10T00:00:00Z",
            cancelAtPeriodEnd: true,
            mrr: 40,
            user: {
              id: "user_3",
              name: "Sophie Laurent",
              email: "sophie.laurent@email.com",
              professionalType: "THERAPEUTE",
              createdAt: "2024-10-05T09:15:00Z"
            },
            payments: {
              total: 4,
              failed: 0,
              lastPayment: "2025-01-10T00:00:00Z",
              nextPayment: "2025-02-10T00:00:00Z"
            },
            metrics: {
              totalRevenue: 160,
              monthsActive: 4,
              ltv: 400
            }
          }
        ])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des abonnements:", error)
      toast.error("Erreur lors du chargement des abonnements")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        // Données de démonstration
        setStats({
          totalSubscriptions: 156,
          activeSubscriptions: 142,
          canceledSubscriptions: 14,
          totalMRR: 4680,
          mrrGrowth: 12.3,
          churnRate: 2.8,
          averageLTV: 380,
          failedPayments: 7
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    }
  }

  const handleChangePlan = async (subscriptionId: string, newPlan: 'standard' | 'premium') => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/change-plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      })

      if (response.ok) {
        toast.success("Plan modifié avec succès")
        await fetchSubscriptions()
        await fetchStats()
      } else {
        toast.error("Erreur lors de la modification du plan")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la modification du plan")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelSubscription = async (subscriptionId: string, immediately: boolean = false) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${immediately ? 'annuler immédiatement' : 'programmer l\'annulation de'} cet abonnement ?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately })
      })

      if (response.ok) {
        toast.success(immediately ? "Abonnement annulé immédiatement" : "Annulation programmée")
        await fetchSubscriptions()
        await fetchStats()
      } else {
        toast.error("Erreur lors de l'annulation")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'annulation")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReactivateSubscription = async (subscriptionId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/reactivate`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success("Abonnement réactivé avec succès")
        await fetchSubscriptions()
        await fetchStats()
      } else {
        toast.error("Erreur lors de la réactivation")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la réactivation")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetryPayment = async (subscriptionId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/retry-payment`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success("Nouvelle tentative de paiement initiée")
        await fetchSubscriptions()
        await fetchStats()
      } else {
        toast.error("Erreur lors de la nouvelle tentative")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la nouvelle tentative")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, label: "Actif", icon: CheckCircle },
      past_due: { variant: "destructive" as const, label: "Impayé", icon: AlertTriangle },
      canceled: { variant: "secondary" as const, label: "Annulé", icon: XCircle },
      incomplete: { variant: "secondary" as const, label: "Incomplet", icon: AlertTriangle },
      unpaid: { variant: "destructive" as const, label: "Non payé", icon: XCircle },
      trialing: { variant: "outline" as const, label: "Essai", icon: Calendar }
    }
    
    const config = variants[status as keyof typeof variants] || variants.canceled
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => (
    <Badge variant={plan === 'premium' ? 'default' : 'secondary'}>
      {plan === 'premium' ? 'Premium' : 'Standard'}
    </Badge>
  )

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchTerm === "" || 
      sub.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesPlan = planFilter === 'all' || sub.plan === planFilter
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 pt-20">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Abonnements</h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble et gestion avancée des abonnements Stripe
          </p>
        </div>

      {/* Tabs pour organiser le contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gestion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMRR}€</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={`flex items-center ${stats.mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.mrrGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.mrrGrowth)}% ce mois
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                  <p className="text-xs text-muted-foreground">
                    sur {stats.totalSubscriptions} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Churn</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.churnRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.canceledSubscriptions} annulations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements Échoués</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
                  <p className="text-xs text-muted-foreground">
                    Nécessitent une action
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions rapides pour les problèmes urgents */}
          {stats && stats.failedPayments > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Actions Urgentes Requises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-red-700">
                    {stats.failedPayments} paiements ont échoué et nécessitent votre attention
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter('past_due')
                      setActiveTab('management')
                    }}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Voir les paiements échoués
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SubscriptionMetricsChart />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          {/* Filtres et recherche */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="past_due">Impayé</SelectItem>
                    <SelectItem value="canceled">Annulé</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={(value: any) => setPlanFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les plans</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => { fetchSubscriptions(); fetchStats(); }} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des abonnements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Abonnements ({filteredSubscriptions.length})</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun abonnement trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>MRR</TableHead>
                      <TableHead>Prochain paiement</TableHead>
                      <TableHead>LTV</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.user.name}</div>
                            <div className="text-sm text-gray-500">{subscription.user.email}</div>
                            {subscription.user.professionalType && (
                              <div className="text-xs text-gray-400">
                                {getProfessionalTypeLabel(subscription.user.professionalType)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(subscription.plan)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(subscription.status)}
                            {subscription.cancelAtPeriodEnd && (
                              <Badge variant="outline" className="text-xs">
                                Annulation programmée
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{subscription.mrr}€</span>
                        </TableCell>
                        <TableCell>
                          {subscription.payments.nextPayment && (
                            <div className="text-sm">
                              {format(new Date(subscription.payments.nextPayment), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          )}
                          {subscription.payments.failed > 0 && (
                            <div className="text-xs text-red-600">
                              {subscription.payments.failed} échec(s)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{subscription.metrics.ltv}€</span>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubscription(subscription)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Gestion de l'abonnement - {subscription.user.name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              {selectedSubscription?.id === subscription.id && (
                                <SubscriptionDetails
                                  subscription={selectedSubscription}
                                  onChangePlan={handleChangePlan}
                                  onCancel={handleCancelSubscription}
                                  onReactivate={handleReactivateSubscription}
                                  onRetryPayment={handleRetryPayment}
                                  isProcessing={isProcessing}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
  )
}

// Composant pour les détails de l'abonnement
function SubscriptionDetails({ 
  subscription, 
  onChangePlan, 
  onCancel, 
  onReactivate, 
  onRetryPayment, 
  isProcessing 
}: SubscriptionDetailsProps) {
  const [adminNote, setAdminNote] = useState("")

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, label: "Actif", icon: CheckCircle },
      past_due: { variant: "destructive" as const, label: "Impayé", icon: AlertTriangle },
      canceled: { variant: "secondary" as const, label: "Annulé", icon: XCircle },
      incomplete: { variant: "secondary" as const, label: "Incomplet", icon: AlertTriangle },
      unpaid: { variant: "destructive" as const, label: "Non payé", icon: XCircle },
      trialing: { variant: "outline" as const, label: "Essai", icon: Calendar }
    }
    
    const config = variants[status as keyof typeof variants] || variants.canceled
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => (
    <Badge variant={plan === 'premium' ? 'default' : 'secondary'}>
      {plan === 'premium' ? 'Premium' : 'Standard'}
    </Badge>
  )

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Informations Client</h3>
          <div className="space-y-2">
            <div><strong>Nom :</strong> {subscription.user.name}</div>
            <div><strong>Email :</strong> {subscription.user.email}</div>
            {subscription.user.professionalType && (
              <div><strong>Type :</strong> {getProfessionalTypeLabel(subscription.user.professionalType)}</div>
            )}
            <div><strong>Client depuis :</strong> {format(new Date(subscription.user.createdAt), 'dd/MM/yyyy', { locale: fr })}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Détails Abonnement</h3>
          <div className="space-y-2">
            <div><strong>Plan :</strong> {getPlanBadge(subscription.plan)}</div>
            <div><strong>Statut :</strong> {getStatusBadge(subscription.status)}</div>
            <div><strong>MRR :</strong> {subscription.mrr}€</div>
            <div><strong>Période :</strong> {format(new Date(subscription.currentPeriodStart), 'dd/MM', { locale: fr })} - {format(new Date(subscription.currentPeriodEnd), 'dd/MM', { locale: fr })}</div>
            <div><strong>ID Stripe :</strong> <code className="text-xs">{subscription.stripeSubscriptionId}</code></div>
          </div>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subscription.metrics.totalRevenue}€</div>
            <p className="text-xs text-muted-foreground">Revenus totaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subscription.metrics.monthsActive}</div>
            <p className="text-xs text-muted-foreground">Mois actif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subscription.metrics.ltv}€</div>
            <p className="text-xs text-muted-foreground">LTV estimée</p>
          </CardContent>
        </Card>
      </div>

      {/* Historique des paiements */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Historique des Paiements</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Paiements réussis :</span>
            <span className="font-medium text-green-600">{subscription.payments.total - subscription.payments.failed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Paiements échoués :</span>
            <span className="font-medium text-red-600">{subscription.payments.failed}</span>
          </div>
          {subscription.payments.lastPayment && (
            <div className="flex justify-between items-center">
              <span>Dernier paiement :</span>
              <span>{format(new Date(subscription.payments.lastPayment), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions administratives */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Actions Administratives</h3>
        
        {/* Changement de plan */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangePlan(subscription.id, subscription.plan === 'standard' ? 'premium' : 'standard')}
            disabled={isProcessing || subscription.status !== 'active'}
          >
            {subscription.plan === 'standard' ? 'Upgrader vers Premium' : 'Downgrader vers Standard'}
          </Button>
        </div>

        {/* Actions selon le statut */}
        <div className="flex gap-2 flex-wrap">
          {subscription.status === 'past_due' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetryPayment(subscription.id)}
              disabled={isProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Relancer le paiement
            </Button>
          )}

          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(subscription.id, false)}
                disabled={isProcessing}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Programmer l'annulation
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(subscription.id, true)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler immédiatement
              </Button>
            </>
          )}

          {subscription.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(subscription.id)}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Annuler l'annulation
            </Button>
          )}

          {subscription.status === 'canceled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(subscription.id)}
              disabled={isProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réactiver l'abonnement
            </Button>
          )}
        </div>

        {/* Note administrative */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Note administrative :</label>
          <Textarea
            placeholder="Ajouter une note sur cet abonnement..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
          />
          <Button size="sm" variant="outline">
            Sauvegarder la note
          </Button>
        </div>

        {/* Actions de contact */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Envoyer un email
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Appeler le client
          </Button>
        </div>
      </div>
    </div>
  )
}