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
  Shield
} from "lucide-react"

interface MenuItem {
  title: string
  href: string
  icon: any
  badge?: number | string
  description?: string
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [pendingRequests, setPendingRequests] = useState(0)

  // Récupérer le nombre de demandes en attente
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await fetch('/api/admin/cancelation-requests?filter=pending')
        if (response.ok) {
          const data = await response.json()
          setPendingRequests(data.pending || 0)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error)
      }
    }

    fetchPendingRequests()
  }, [])

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Vue d'ensemble de la plateforme"
    },
    {
      title: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: Users,
      description: "Gestion des utilisateurs (CRUD complet)"
    },
    {
      title: "Demandes d'annulation",
      href: "/admin/demandes-annulation",
      icon: XCircle,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      description: "Traitement des demandes d'annulation"
    },
    // Liens fonctionnels disponibles
    {
      title: "Statistiques",
      href: "/admin/dashboard/stats",
      icon: BarChart3,
      description: "API de statistiques détaillées"
    },
    
    // Liens à développer (pages à créer)
    {
      title: "Abonnements",
      href: "/admin/abonnements",
      icon: CreditCard,
      description: "Gestion des abonnements Stripe"
    },
    {
      title: "Rendez-vous",
      href: "/admin/rendez-vous", 
      icon: Calendar,
      description: "Supervision des rendez-vous"
    },
    {
      title: "Factures",
      href: "/admin/factures",
      icon: FileText,
      description: "Gestion des factures"
    },
    {
      title: "Professionnels",
      href: "/admin/professionnels",
      icon: Building,
      description: "Gestion spécifique des professionnels"
    },
    {
      title: "Rapports avancés",
      href: "/admin/rapports",
      icon: TrendingUp,
      description: "Rapports et analytics"
    },
    {
      title: "Configuration",
      href: "/admin/configuration",
      icon: Settings,
      description: "Paramètres de la plateforme"
    },
  ]

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r shadow-sm">
      {/* En-tête */}
      <div className="p-4 border-b bg-red-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-800">Interface Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 overflow-y-auto h-full">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <div key={item.href} className="group">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-red-50 text-red-700 border border-red-200 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-red-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-red-600" : "text-gray-500"
                    )} />
                    <span>{item.title}</span>
                  </div>
                  
                  {item.badge && (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full font-medium",
                      isActive 
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700 animate-pulse"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
                
                {/* Description au hover */}
                {item.description && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-8 mt-1">
                    <p className="text-xs text-gray-500 italic">{item.description}</p>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Section status en bas */}
        <div className="mt-8 pt-4 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>✅ Fonctionnel</span>
              <span className="text-green-600">3 pages</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🚧 À développer</span>
              <span className="text-orange-600">6 pages</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}