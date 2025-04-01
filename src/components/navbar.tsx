// src/components/navbar.tsx
"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { UserRole } from "@prisma/client"
import {
  Menu,
  Bell,
  ChevronDown,
  UserCircle,
  LayoutDashboard,
  LogOut,
  Calendar,
  Users,
  Settings,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession()
  
  return (
    <nav className="border-b">
      <div className="w-full mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo et menu burger */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <Link 
            href={session ? "/tableau-de-bord" : "/"} 
            className="flex items-center space-x-2"
          >
            <span className="font-title text-2xl font-bold text-primary">
              SereniBook
            </span>
          </Link>
        </div>

        {/* Navigation selon l'état de connexion */}
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <UserCircle className="h-6 w-6" />
                    <span className="hidden md:inline-block font-medium">
                      {session.user.name || "Mon profil"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <div style={{ zIndex: 50 }}>
                  <DropdownMenuContent 
                    align="end" 
                    sideOffset={6}
                    className="w-56 rounded-md p-2 bg-white shadow-md border"
                  >
                    <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      <Link href="/tableau-de-bord" className="flex-1">Tableau de bord</Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                      <UserCircle className="h-4 w-4" />
                      <Link href="/profil" className="flex-1">Mon profil</Link>
                    </DropdownMenuItem>

                    {session.user.role === UserRole.PROFESSIONAL && (
                      <>
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                          <Calendar className="h-4 w-4" />
                          <Link href="/rendez-vous" className="flex-1">Rendez-vous</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                          <Users className="h-4 w-4" />
                          <Link href="/clients" className="flex-1">Clients</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                          <Clock className="h-4 w-4" />
                          <Link href="/services" className="flex-1">Services</Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {session.user.role === UserRole.CLIENT && (
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <Calendar className="h-4 w-4" />
                        <Link href="/mes-rendez-vous" className="flex-1">Mes réservations</Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <Link href="/parametres" className="flex-1">Paramètres</Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-2 h-px bg-gray-100" />
                    
                    <DropdownMenuItem 
                      onClick={() => signOut({ callbackUrl: "/connexion" })}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </div>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/connexion">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/inscription">
                <Button>S'inscrire</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}