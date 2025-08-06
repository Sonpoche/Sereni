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
  MapPin,
  Wrench
} from "lucide-react"

interface MenuItem {
  title: string
  href: string
  icon: any
  badge?: number | string
  description?: string
  status?: 'completed' | 'in-progress' | 'pending'
  section?: 'main' | 'tools'
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [pendingRequests, setPendingRequests] = useState(0)
  const [professionalAlerts, setProfessionalAlerts] = useState(0)

  // Récupérer les notifications et alertes
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Demandes d'annulation en attente
        const cancelationResponse = await fetch('/api/admin/cancelation-requests?filter=pending')
        if (cancelationResponse.ok) {
          const cancelationData = await cancelationResponse.json()
          setPendingRequests(cancelationData.pending || 0)
        }

        // Alertes pour les professionnels - CORRECTION ICI
        const professionalResponse = await fetch('/api/admin/professionnels/stats') // ✅ CORRIGÉ
        if (professionalResponse.ok) {
          const professionalData = await professionalResponse.json()
          const totalAlerts = (professionalData.alerts?.incompleteProfiles || 0) + 
                            (professionalData.alerts?.inactiveProfessionals || 0)
          setProfessionalAlerts(totalAlerts)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error)
      }
    }

    fetchAlerts()
    
    // Actualiser toutes les 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const menuItems: MenuItem[] = [
    // Section principale
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Vue d'ensemble de la plateforme",
      status: 'completed',
      section: 'main'
    },
    {
      title: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: Users,
      description: "Gestion des utilisateurs (CRUD complet)",
      status: 'completed',
      section: 'main'
    },
    {
      title: "Professionnels",
      href: "/admin/professionnels",
      icon: Building,
      badge: professionalAlerts > 0 ? professionalAlerts : undefined,
      description: "🎯 NOUVELLE PAGE - Supervision métier",
      status: 'completed',
      section: 'main'
    },
    {
      title: "Abonnements",
      href: "/admin/abonnements",
      icon: CreditCard,
      description: "✅ COMPLET - Gestion Stripe & MRR",
      status: 'completed',
      section: 'main'
    },
    {
      title: "Demandes d'annulation",
      href: "/admin/demandes-annulation",
      icon: XCircle,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      description: "Traitement des demandes d'annulation",
      status: 'completed',
      section: 'main'
    },
    
    // Pages à développer (Priorité 2 & 3)
    {
      title: "Rapports",
      href: "/admin/rapports",
      icon: TrendingUp,
      description: "📊 Priorité 2 - Analytics & Dashboard",
      status: 'pending',
      section: 'main'
    },
    {
      title: "Rendez-vous",
      href: "/admin/rendez-vous", 
      icon: Calendar,
      description: "📊 Priorité 2 - Supervision opérationnelle",
      status: 'pending',
      section: 'main'
    },
    {
      title: "Factures",
      href: "/admin/factures",
      icon: FileText,
      description: "⚙️ Priorité 3 - Gestion financière",
      status: 'pending',
      section: 'main'
    },
    {
      title: "Configuration",
      href: "/admin/configuration",
      icon: Settings,
      description: "⚙️ Priorité 3 - Paramètres plateforme",
      status: 'pending',
      section: 'main'
    },

    // Section outils de maintenance
    {
      title: "Coordonnées GPS",
      href: "/admin/coordonnees",
      icon: MapPin,
      description: "🔧 Outil - Diagnostic géolocalisation",
      status: 'completed',
      section: 'tools'
    }
  ]

  // Séparer les éléments par section
  const mainItems = menuItems.filter(item => item.section === 'main')
  const toolItems = menuItems.filter(item => item.section === 'tools')

  const renderMenuItem = (item: MenuItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const isCompleted = item.status === 'completed'
    const isPending = item.status === 'pending'

    return (
      <div key={item.href} className="group">
        <Link
          href={item.href}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
            isActive && isCompleted
              ? "bg-red-50 text-red-700 border border-red-200 shadow-sm"
              : isActive && isPending
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : isCompleted
              ? "text-gray-700 hover:bg-gray-50 hover:text-red-600"
              : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors",
                isActive && isCompleted ? "text-red-600" :
                isActive && isPending ? "text-orange-600" :
                isCompleted ? "text-gray-500" : "text-gray-400"
              )} />
              
              {/* Indicateur de statut */}
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
              {isPending && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={cn(
              isCompleted ? "text-gray-900" : "text-gray-500"
            )}>
              {item.title}
            </span>
          </div>
          
          {/* Badge pour les notifications */}
          {item.badge && (
            <span className={cn(
              "px-2 py-1 text-xs rounded-full font-medium min-w-[20px] text-center",
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
            <p className={cn(
              "text-xs italic",
              item.description.includes('🎯') ? "text-green-600 font-medium" :
              item.description.includes('✅') ? "text-blue-600" :
              item.description.includes('📊') ? "text-orange-600" :
              item.description.includes('⚙️') ? "text-gray-500" :
              item.description.includes('🔧') ? "text-purple-600" :
              "text-gray-500"
            )}>
              {item.description}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r shadow-sm">
      {/* En-tête */}
      <div className="p-4 border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-800">Interface Admin</span>
        </div>
        <p className="text-xs text-red-600 mt-1">
          Système de gestion SereniBook
        </p>
      </div>

      {/* Navigation */}
      <div className="p-4 overflow-y-auto h-full">
        {/* Section principale */}
        <nav className="space-y-1">
          {mainItems.map(renderMenuItem)}
        </nav>

        {/* Séparateur pour les outils */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Section outils de maintenance */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-3 w-3" />
            Outils de Maintenance
          </h3>
          
          <nav className="space-y-1">
            {toolItems.map(renderMenuItem)}
          </nav>
        </div>

        {/* Séparateur */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Section status du projet */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            État du Projet
          </h3>
          
          <div className="text-xs text-gray-600 space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Terminé</span>
              </div>
              <span className="text-green-700 font-semibold">6 pages</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-orange-800">À développer</span>
              </div>
              <span className="text-orange-700 font-semibold">4 pages</span>
            </div>
          </div>

          {/* Prochaine priorité */}
          <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs font-semibold text-green-800">
                Statut Actuel
              </span>
            </div>
            <p className="text-xs text-green-700">
              Page /admin/professionnels <br/>
              <span className="font-semibold text-green-800">✅ TERMINÉE</span>
            </p>
          </div>

          {/* Contact rapide */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Bell className="h-3 w-3" />
              <span>Alertes actives: {(pendingRequests + professionalAlerts)}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}