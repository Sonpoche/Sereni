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
  Clock,
  Search,
  MapPin,
  BookOpen,
  FileText // NOUVEAU : icône pour les factures
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession()
  
  return (
    <nav className="border-b bg-white relative z-50">
      <div className="w-full mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo et menu burger */}
        <div className="flex items-center gap-4">
          {onMenuClick && session && (
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

          {/* Navigation principale - visible sur écrans plus grands */}
          <div className="hidden md:flex items-center space-x-1">
            {!session && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cours-collectifs">Cours collectifs</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/recherche">Trouver un professionnel</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tarifs">Tarifs</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/contact">Contact</Link>
                </Button>
              </>
            )}
            {session && session.user.role === UserRole.CLIENT && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cours-collectifs">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Cours collectifs
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/recherche">
                    <MapPin className="h-4 w-4 mr-1" />
                    Trouver un professionnel
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Navigation selon l'état de connexion */}
        <div className="flex items-center gap-4">
          {!session ? (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/inscription">S'inscrire</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Boutons de navigation rapide pour mobile */}
              <div className="flex md:hidden items-center gap-2">
                {session.user.role === UserRole.CLIENT && (
                  <>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/cours-collectifs">
                        <BookOpen className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/recherche">
                        <Search className="h-5 w-5" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <UserCircle className="h-6 w-6" />
                    <span className="hidden md:inline-block font-medium max-w-[120px] truncate">
                      {session.user.name || "Mon profil"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  sideOffset={6}
                  className="w-56 rounded-md p-2 bg-white shadow-md border z-[60]"
                >
                  {/* Tableau de bord */}
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    <Link href="/tableau-de-bord" className="flex-1">Tableau de bord</Link>
                  </DropdownMenuItem>
                  
                  {/* Mon profil */}
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                    <UserCircle className="h-4 w-4" />
                    <Link href="/profil" className="flex-1">Mon profil</Link>
                  </DropdownMenuItem>

                  {/* Menu spécifique aux professionnels */}
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
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <BookOpen className="h-4 w-4" />
                        <Link href="/mes-cours-collectifs" className="flex-1">Mes cours collectifs</Link>
                      </DropdownMenuItem>
                      {/* NOUVEAU : Facturation pour les professionnels */}
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <FileText className="h-4 w-4" />
                        <Link href="/factures" className="flex-1">Facturation</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Menu spécifique aux clients */}
                  {session.user.role === UserRole.CLIENT && (
                    <>
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <Calendar className="h-4 w-4" />
                        <Link href="/mes-rendez-vous" className="flex-1">Mes réservations</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <BookOpen className="h-4 w-4" />
                        <Link href="/cours-collectifs" className="flex-1">Cours collectifs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <Search className="h-4 w-4" />
                        <Link href="/recherche" className="flex-1">Trouver un praticien</Link>
                      </DropdownMenuItem>
                      {/* NOUVEAU : Mes factures pour les clients */}
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                        <FileText className="h-4 w-4" />
                        <Link href="/mes-factures" className="flex-1">Mes factures</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Paramètres */}
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-primary/5 hover:text-primary cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <Link href="/parametres" className="flex-1">Paramètres</Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 h-px bg-gray-100" />
                  
                  {/* Déconnexion */}
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/connexion" })}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}