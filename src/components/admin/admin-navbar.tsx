// src/components/admin/admin-navbar.tsx
"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Shield,
  ExternalLink,
  Users,
  AlertTriangle
} from "lucide-react"

interface AdminNavbarProps {
  user: {
    name?: string | null
    email?: string | null
    role: string
  }
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo et titre admin */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-title text-xl font-bold text-gray-900">
                SereniBook
              </span>
            </div>
            <Badge variant="destructive" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              ADMIN
            </Badge>
          </Link>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-4">
          {/* Actions rapides */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/utilisateurs">
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/demandes-annulation">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Demandes
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tableau-de-bord">
                <ExternalLink className="h-4 w-4 mr-2" />
                Interface normale
              </Link>
            </Button>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-red-100 text-red-700">
                    {user.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{user.name || 'Admin'}</span>
                  <span className="text-xs text-gray-500">Administrateur</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/admin/profil" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mon profil admin
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/admin/configuration" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}