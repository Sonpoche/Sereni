// src/components/admin/admin-sidebar.tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  XCircle,
  BarChart3,
  Settings,
  AlertTriangle,
  UserCheck,
  Building,
  FileText,
  Calendar,
  TrendingUp,
  Bell,
  Shield,
  Banknote
} from "lucide-react"

interface MenuItem {
  title: string
  href: string
  icon: any
  badge?: number | string
  description?: string
  priority?: 'high' | 'medium' | 'low'
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [pendingRequests, setPendingRequests] = useState(0)
  const [failedPayments, setFailedPayments] = useState(0)

  // Récupérer les notifications/badges
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [requestsResponse, paymentsResponse] = await Promise.all([
          fetch('/api/admin/cancelation-requests?filter=pending'),
          fetch('/api/admin/subscriptions/stats')
        ])

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          setPendingRequests(requestsData.pending || 0)
        }

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          setFailedPayments(paymentsData.stats?.failedPayments || 0)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error)
      }
    }

    fetchNotifications()
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Vue d'ensemble de la plateforme",
      priority: 'high'
    },
    {
      title: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: Users,
      description: "Gestion des utilisateurs (CRUD complet)",
      priority: 'high'
    },
    {
      title: "Abonnements",
      href: "/admin/abonnements",
      icon: CreditCard,
      badge: failedPayments > 0 ? failedPayments : undefined,
      description: "Gestion Stripe complète - Paiements échoués, changements de plan",
      priority: 'high'
    },
    {
      title: "Demandes d'annulation",
      href: "/admin/demandes-annulation",
      icon: XCircle,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      description: "Traitement des demandes d'annulation Stripe",
      priority: 'high'
    },
    // Séparateur visuel pour les priorités moyennes
    {
      title: "Professionnels",
      href: "/admin/professionnels",
      icon: UserCheck,
      description: "Supervision métier - Validation profils, suspensions",
      priority: 'medium'
    },
    {
      title: "Rapports",
      href: "/admin/rapports",
      icon: BarChart3,
      description: "Dashboard analytique - MRR, churn, LTV",
      priority: 'medium'
    },
    {
      title: "Rendez-vous",
      href: "/admin/rendez-vous",
      icon: Calendar,
      description: "Supervision opérationnelle - Vue d'ensemble RDV",
      priority: 'medium'
    },
    // Priorités basses - Configuration
    {
      title: "Factures",
      href: "/admin/factures",
      icon: FileText,
      description: "Gestion financière - Vue globale factures",
      priority: 'low'
    },
    {
      title: "Configuration",
      href: "/admin/configuration",
      icon: Settings,
      description: "Paramètres plateforme - Tarifs, templates",
      priority: 'low'
    }
  ]

  // Grouper les éléments par priorité pour un meilleur affichage
  const highPriorityItems = menuItems.filter(item => item.priority === 'high')
  const mediumPriorityItems = menuItems.filter(item => item.priority === 'medium')
  const lowPriorityItems = menuItems.filter(item => item.priority === 'low')

  const MenuGroup = ({ title, items }: { title: string, items: MenuItem[] }) => (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.title}</span>
            
            {item.badge && (
              <span className={cn(
                "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                isActive
                  ? "bg-primary-foreground text-primary"
                  : "bg-red-100 text-red-800"
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold text-gray-900">Admin</span>
      </div>
      
      <nav className="mt-5 flex-1 px-2 space-y-6">
        <MenuGroup title="Business Critical" items={highPriorityItems} />
        <MenuGroup title="Analytics & Monitoring" items={mediumPriorityItems} />
        <MenuGroup title="Configuration" items={lowPriorityItems} />
      </nav>

      {/* Statut système en bas */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
          <span className="text-xs text-gray-500">Système opérationnel</span>
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}