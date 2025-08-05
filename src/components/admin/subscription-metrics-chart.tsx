// src/components/admin/subscription-metrics-chart.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  RefreshCw
} from "lucide-react"
import { format, subDays, subMonths } from "date-fns"
import { fr } from "date-fns/locale"

interface MetricsData {
  mrrEvolution: Array<{
    date: string
    mrr: number
    newSubscriptions: number
    churn: number
  }>
  planDistribution: Array<{
    plan: string
    count: number
    percentage: number
    mrr: number
  }>
  churnAnalysis: Array<{
    month: string
    churnRate: number
    reasons: Array<{
      reason: string
      count: number
    }>
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    subscriptions: number
    averageRevenue: number
  }>
}

interface SubscriptionMetricsChartProps {
  className?: string
}

export function SubscriptionMetricsChart({ className }: SubscriptionMetricsChartProps) {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetricsData()
  }, [timeRange])

  const fetchMetricsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/metrics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetricsData(data.metrics)
      } else {
        // Données de démonstration pour le développement
        const mockData: MetricsData = {
          mrrEvolution: generateMRRData(),
          planDistribution: [
            { plan: 'Standard', count: 85, percentage: 60, mrr: 1700 },
            { plan: 'Premium', count: 57, percentage: 40, mrr: 2280 }
          ],
          churnAnalysis: generateChurnData(),
          revenueByMonth: generateRevenueData()
        }
        setMetricsData(mockData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error)
    } finally {
      setLoading(false)
    }
  }

  // Génération de données de démonstration
  const generateMRRData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const baseMRR = 4000
      const growth = Math.random() * 200 - 50 // Variation aléatoire
      const mrr = baseMRR + (days - i) * 15 + growth
      
      data.push({
        date: format(date, timeRange === '7d' ? 'dd/MM' : 'dd/MM', { locale: fr }),
        mrr: Math.round(mrr),
        newSubscriptions: Math.floor(Math.random() * 5) + 1,
        churn: Math.floor(Math.random() * 3)
      })
    }
    
    return data
  }

  const generateChurnData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
    return months.map(month => ({
      month,
      churnRate: Math.random() * 5 + 1, // 1-6%
      reasons: [
        { reason: 'Prix trop élevé', count: Math.floor(Math.random() * 5) + 1 },
        { reason: 'Fonctionnalités manquantes', count: Math.floor(Math.random() * 3) + 1 },
        { reason: 'Concurrence', count: Math.floor(Math.random() * 2) + 1 },
        { reason: 'Arrêt activité', count: Math.floor(Math.random() * 2) }
      ]
    }))
  }

  const generateRevenueData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
    return months.map((month, index) => {
      const baseRevenue = 3500 + index * 400
      const subscriptions = 120 + index * 12
      return {
        month,
        revenue: baseRevenue + Math.random() * 500,
        subscriptions,
        averageRevenue: Math.round((baseRevenue / subscriptions) * 100) / 100
      }
    })
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

  if (loading || !metricsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contrôles */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Abonnements</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="1y">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchMetricsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Évolution du MRR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Évolution du MRR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metricsData.mrrEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}${name === 'mrr' ? '€' : ''}`,
                  name === 'mrr' ? 'MRR' : name === 'newSubscriptions' ? 'Nouveaux' : 'Churn'
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="mrr"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="MRR (€)"
              />
              <Line
                type="monotone"
                dataKey="newSubscriptions"
                stroke="#10b981"
                strokeWidth={2}
                name="Nouveaux abonnements"
              />
              <Line
                type="monotone"
                dataKey="churn"
                stroke="#ef4444"
                strokeWidth={2}
                name="Churn"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribution des Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metricsData.planDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ plan, percentage }) => `${plan} ${percentage}%`}
                >
                  {metricsData.planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value} abonnements (${props.payload.mrr}€ MRR)`,
                  props.payload.plan
                ]} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Détails textuels */}
            <div className="mt-4 space-y-2">
              {metricsData.planDistribution.map((plan, index) => (
                <div key={plan.plan} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{plan.plan}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{plan.count} abonnés</div>
                    <div className="text-gray-500">{plan.mrr}€ MRR</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyse du Churn */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Analyse du Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricsData.churnAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Taux de churn']} />
                <Bar dataKey="churnRate" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Principales raisons de churn ce mois */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Principales raisons ce mois :</h4>
              <div className="space-y-1">
                {metricsData.churnAnalysis[metricsData.churnAnalysis.length - 1]?.reasons
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                  .map((reason, index) => (
                    <div key={reason.reason} className="flex justify-between text-sm">
                      <span className="text-gray-600">{reason.reason}</span>
                      <span className="font-medium">{reason.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenus par mois */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenus Mensuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `${Math.round(Number(value))}€` : 
                  name === 'subscriptions' ? `${value} abonnés` :
                  `${value}€`,
                  name === 'revenue' ? 'Revenus' : 
                  name === 'subscriptions' ? 'Abonnements' : 'Revenus moyen'
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="revenue" 
                fill="#3b82f6" 
                name="Revenus totaux (€)"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="subscriptions" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Nombre d'abonnements"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}