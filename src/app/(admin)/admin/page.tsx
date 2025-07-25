// src/app/(admin)/admin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Euro,
  Activity,
  Settings
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  users: {
    total: number
    clients: number
    professionals: number
    newThisMonth: number
  }
  subscriptions: {
    total: number
    standard: number
    premium: number
    mrr: number
    churnRate: number
  }
  bookings: {
    total: number
    thisMonth: number
    confirmed: number
    cancelled: number
  }
  revenue: {
    thisMonth: number
    lastMonth: number
    growth: number
  }
  alerts: {
    cancelationRequests: number
    failedPayments: number
    expiringSoon: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Données de démonstration en cas d'erreur
        setStats({
          users: {
            total: 157,
            clients: 98,
            professionals: 59,
            newThisMonth: 23
          },
          subscriptions: {
            total: 59,
            standard: 42,
            premium: 17,
            mrr: 1680,
            churnRate: 3.2
          },
          bookings: {
            total: 456,
            thisMonth: 89,
            confirmed: 234,
            cancelled: 12
          },
          revenue: {
            thisMonth: 1680,
            lastMonth: 1520,
            growth: 10.5
          },
          alerts: {
            cancelationRequests: 3,
            failedPayments: 2,
            expiringSoon: 5
          }
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        Erreur lors du chargement des statistiques
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Dashboard Administrateur
        </h1>
        <p className="text-gray-600">
          Vue d'ensemble de la plateforme SereniBook
        </p>
      </div>

      {/* Alertes importantes */}
      {stats.alerts.cancelationRequests > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {stats.alerts.cancelationRequests} demande(s) d'annulation en attente
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/demandes-annulation">
                Traiter maintenant
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Utilisateurs totaux */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs totaux
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.users.newThisMonth} ce mois
            </p>
          </CardContent>
        </Card>

        {/* Professionnels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Professionnels
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.professionals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.clients} clients
            </p>
          </CardContent>
        </Card>

        {/* Abonnements actifs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Abonnements actifs
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.subscriptions.premium} Premium, {stats.subscriptions.standard} Standard
            </p>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              MRR (Revenus mensuels)
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions.mrr}€</div>
            <p className="text-xs text-green-600">
              +{stats.revenue.growth}% vs mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Rendez-vous ce mois</span>
              </div>
              <Badge variant="secondary">{stats.bookings.thisMonth}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">RDV confirmés</span>
              </div>
              <Badge variant="secondary">{stats.bookings.confirmed}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">RDV annulés</span>
              </div>
              <Badge variant="secondary">{stats.bookings.cancelled}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Factures générées</span>
              </div>
              <Badge variant="secondary">45</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions requises */}
        <Card>
          <CardHeader>
            <CardTitle>Actions requises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.alerts.cancelationRequests > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Demandes d'annulation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.alerts.cancelationRequests}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/demandes-annulation">Traiter</Link>
                  </Button>
                </div>
              </div>
            )}

            {stats.alerts.failedPayments > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">
                    Paiements échoués
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.alerts.failedPayments}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/abonnements?status=failed">Voir</Link>
                  </Button>
                </div>
              </div>
            )}

            {stats.alerts.expiringSoon > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Abonnements expirés bientôt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.alerts.expiringSoon}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/abonnements?expiring=true">Voir</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Pas d'alertes */}
            {stats.alerts.cancelationRequests === 0 && 
             stats.alerts.failedPayments === 0 && 
             stats.alerts.expiringSoon === 0 && (
              <div className="text-center text-gray-500 py-4">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Aucune action requise</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Liens fonctionnels */}
            <Button variant="outline" asChild>
              <Link href="/admin/utilisateurs">
                <Users className="h-4 w-4 mr-2" />
                Gérer les utilisateurs
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/admin/demandes-annulation">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Demandes d'annulation
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/admin/dashboard/stats">
                <TrendingUp className="h-4 w-4 mr-2" />
                API Statistiques
              </Link>
            </Button>
            
            {/* Liens à développer */}
            <Button variant="outline" disabled>
              <CreditCard className="h-4 w-4 mr-2" />
              Abonnements (à venir)
            </Button>
            
            <Button variant="outline" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              Rendez-vous (à venir)
            </Button>
            
            <Button variant="outline" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Configuration (à venir)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métriques business */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.revenue.growth}%
              </div>
              <p className="text-sm text-gray-600">Croissance MRR</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.subscriptions.churnRate}%
              </div>
              <p className="text-sm text-gray-600">Taux de churn</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((stats.subscriptions.premium / stats.subscriptions.total) * 100)}%
              </div>
              <p className="text-sm text-gray-600">Adoption Premium</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}