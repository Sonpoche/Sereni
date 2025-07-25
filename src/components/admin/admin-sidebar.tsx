// src/components/admin/admin-sidebar.tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
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
  Calendar
} from "lucide-react"

interface MenuItem {
  title: string
  href: string
  icon: any
  badge?: number | string
}

export function AdminSidebar() {
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: Users,
    },
    {
      title: "Professionnels",
      href: "/admin/professionnels",
      icon: Building,
    },
    {
      title: "Abonnements",
      href: "/admin/abonnements",
      icon: CreditCard,
    },
    {
      title: "Demandes d'annulation",
      href: "/admin/demandes-annulation",
      icon: XCircle,
      badge: "3", // Nombre de demandes en attente
    },
    {
      title: "Rendez-vous",
      href: "/admin/rendez-vous",
      icon: Calendar,
    },
    {
      title: "Factures",
      href: "/admin/factures",
      icon: FileText,
    },
    {
      title: "Statistiques",
      href: "/admin/statistiques",
      icon: BarChart3,
    },
    {
      title: "Configuration",
      href: "/admin/configuration",
      icon: Settings,
    },
  ]

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r shadow-sm">
      <div className="p-4 overflow-y-auto h-full">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
                
                {item.badge && (
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    isActive 
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Alertes en bas */}
        <div className="mt-8 pt-4 border-t">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Alertes système
              </span>
            </div>
            <p className="text-xs text-yellow-700">
              3 demandes d'annulation en attente
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}