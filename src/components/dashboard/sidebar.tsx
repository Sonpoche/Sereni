// src/components/dashboard/sidebar.tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { UserRole } from "@prisma/client"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  CreditCard,
  Clock,
  X,
  Star,
  UserCircle,
  BookOpen,
  Search,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user: {
    role: UserRole
    name?: string | null
  }
}

interface MenuItem {
  title: string
  href: string
  icon: any
  roles?: UserRole[]
}

export function DashboardSidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      title: "Tableau de bord",
      href: "/tableau-de-bord",
      icon: LayoutDashboard,
    },
    {
      title: "Mes rendez-vous",
      href: user.role === UserRole.PROFESSIONAL ? "/rendez-vous" : "/mes-rendez-vous",
      icon: Calendar,
    },
    {
      title: "Cours collectifs",
      href: user.role === UserRole.PROFESSIONAL ? "/mes-cours-collectifs" : "/cours-collectifs",
      icon: BookOpen,
    },
    {
      title: "Trouver un professionnel",
      href: "/recherche",
      icon: Search,
      roles: [UserRole.CLIENT],
    },
    {
      title: "Mon profil",
      href: "/profil",
      icon: UserCircle,
    },
    {
      title: "Clients",
      href: "/clients",
      icon: Users,
      roles: [UserRole.PROFESSIONAL, UserRole.ADMIN],
    },
    {
      title: "Services",
      href: "/services",
      icon: Clock,
      roles: [UserRole.PROFESSIONAL, UserRole.ADMIN],
    },
  ]

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Z-index inférieur à la navbar */}
      <aside className={cn(
        "fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r shadow-md transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* En-tête mobile */}
        <div className="h-12 flex items-center justify-between px-4 border-b lg:hidden">
          <span className="font-title text-lg font-bold text-primary">
            Menu
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="p-4 pt-6 overflow-y-auto h-full">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              // Vérifier si l'élément doit être affiché pour ce rôle
              if (item.roles && !item.roles.includes(user.role)) {
                return null
              }

              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Fermer la sidebar sur mobile lors de la navigation
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Section paramètres en bas */}
          <div className="mt-8 pt-4 border-t">
            <Link
              href="/parametres"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/parametres"
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span>Paramètres</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}