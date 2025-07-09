// src/app/(dashboard)/parametres/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  User, 
  CreditCard, 
  Shield, 
  Mail, 
  Calendar, 
  Globe, 
  Settings,
  ChevronRight,
  Palette,
  Clock
} from "lucide-react"
import Link from "next/link"

interface SettingCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
  comingSoon?: boolean
}

export default function ParametresPage() {
  const { data: session } = useSession()

  const settingsCategories: SettingCard[] = [
    {
      title: "Notifications",
      description: "Configurez vos préférences de notifications par email et SMS",
      icon: Bell,
      href: "/parametres/notifications",
    },
    {
      title: "Profil professionnel",
      description: "Modifiez vos informations personnelles et professionnelles",
      icon: User,
      href: "/parametres/profil",
      comingSoon: true
    },
    {
      title: "Disponibilités",
      description: "Gérez vos créneaux de disponibilité et horaires de travail",
      icon: Clock,
      href: "/parametres/disponibilites",
      comingSoon: true
    },
    {
      title: "Facturation",
      description: "Paramètres de facturation, coordonnées bancaires et TVA",
      icon: CreditCard,
      href: "/parametres/facturation",
      comingSoon: true
    },
    {
      title: "Site web",
      description: "Personnalisez votre site web et page de réservation",
      icon: Globe,
      href: "/parametres/site-web",
      comingSoon: true
    },
    {
      title: "Abonnement",
      description: "Gérez votre abonnement et vos options premium",
      icon: CreditCard,
      href: "/parametres/abonnement",
      badge: "Premium",
      comingSoon: true
    },
    {
      title: "Sécurité",
      description: "Mot de passe, authentification à deux facteurs",
      icon: Shield,
      href: "/parametres/securite",
      comingSoon: true
    },
    {
      title: "Intégrations",
      description: "Connectez vos outils externes (Google Calendar, Zoom, etc.)",
      icon: Settings,
      href: "/parametres/integrations",
      comingSoon: true
    }
  ]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <PageHeader
        title="Paramètres"
        description="Gérez vos préférences et configurez votre compte"
      />

      <div className="mt-8 space-y-6">
        {/* Informations utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{session?.user?.name || 'Utilisateur'}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grille des paramètres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsCategories.map((setting) => (
            <Card 
              key={setting.href} 
              className={`hover:shadow-lg transition-shadow ${
                setting.comingSoon ? 'opacity-60' : 'cursor-pointer hover:border-primary/50'
              }`}
            >
              <CardContent className="p-6">
                {setting.comingSoon ? (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <setting.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-700">{setting.title}</h3>
                          {setting.badge && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              {setting.badge}
                            </span>
                          )}
                          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
                            Bientôt
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href={setting.href} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <setting.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{setting.title}</h3>
                            {setting.badge && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                {setting.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{setting.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section aide */}
        <Card>
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
            <CardDescription>
              Consultez notre documentation ou contactez notre support
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/aide/documentation">
                Documentation
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/aide/contact">
                Contacter le support
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}