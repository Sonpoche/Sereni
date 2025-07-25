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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, Settings, User, Home } from "lucide-react"

interface AdminNavbarProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo et titre */}
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-title text-xl font-bold text-gray-900">
              Admin SereniBook
            </span>
          </Link>
          <Badge variant="destructive" className="text-xs">
            ADMINISTRATION
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Lien vers le site principal */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Site principal
            </Link>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{user.name || "Admin"}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profil" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/parametres" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}