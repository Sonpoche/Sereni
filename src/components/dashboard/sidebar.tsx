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
  BookOpen
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
    {
      title: "Mes cours collectifs",
      href: "/mes-cours-collectifs",
      icon: BookOpen,
      roles: [UserRole.PROFESSIONAL, UserRole.ADMIN],
    },
  ]

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-full w-64 bg-white border-r shadow-md transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* En-tête mobile */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="font-title text-xl font-bold text-primary">
            SereniBook
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
        <div className="p-4 pt-6 overflow-y-auto h-[calc(100vh-4rem)]">
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
        </div>
      </aside>
    </>
  )
}