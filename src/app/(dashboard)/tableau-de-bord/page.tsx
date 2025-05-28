// src/app/(dashboard)/tableau-de-bord/page.tsx
import { auth } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  MapPin,
  BookOpen,
  Settings
} from "lucide-react"
import Link from "next/link"
import { NearbyCourses } from "@/components/dashboard/nearby-courses"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    return redirect("/connexion")
  }

  const isClient = session.user.role === UserRole.CLIENT
  const isProfessional = session.user.role === UserRole.PROFESSIONAL

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={`Bonjour ${session.user.name || 'utilisateur'} !`}
        description={
          isClient 
            ? "Découvrez les services bien-être près de chez vous"
            : "Gérez votre activité et vos clients"
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section pour les clients */}
          {isClient && (
            <>
              {/* Cours collectifs à proximité */}
              <NearbyCourses />
              
              {/* Actions rapides pour clients */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/recherche">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <MapPin className="h-6 w-6" />
                        <span>Trouver un professionnel</span>
                      </Button>
                    </Link>
                    <Link href="/cours-collectifs">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Users className="h-6 w-6" />
                        <span>Cours collectifs</span>
                      </Button>
                    </Link>
                    <Link href="/mes-rendez-vous">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Calendar className="h-6 w-6" />
                        <span>Mes réservations</span>
                      </Button>
                    </Link>
                    <Link href="/profil">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Settings className="h-6 w-6" />
                        <span>Mon profil</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Section pour les professionnels */}
          {isProfessional && (
            <>
              {/* Statistiques rapides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Rendez-vous aujourd'hui
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">
                      +2 par rapport à hier
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Clients ce mois
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">
                      +12% par rapport au mois dernier
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Revenus ce mois
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,240€</div>
                    <p className="text-xs text-muted-foreground">
                      +8% par rapport au mois dernier
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Actions rapides pour professionnels */}
              <Card>
                <CardHeader>
                  <CardTitle>Gestion rapide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/rendez-vous">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Calendar className="h-6 w-6" />
                        <span className="text-sm">Rendez-vous</span>
                      </Button>
                    </Link>
                    <Link href="/clients">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Users className="h-6 w-6" />
                        <span className="text-sm">Clients</span>
                      </Button>
                    </Link>
                    <Link href="/services">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Clock className="h-6 w-6" />
                        <span className="text-sm">Services</span>
                      </Button>
                    </Link>
                    <Link href="/programmes-cours">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <BookOpen className="h-6 w-6" />
                        <span className="text-sm">Cours collectifs</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profil incomplet ou conseils */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isClient ? "Optimisez votre expérience" : "Développez votre activité"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isClient ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Quelques conseils pour tirer le meilleur parti de SereniBook
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Complétez votre profil pour des recommandations personnalisées</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Explorez les cours collectifs près de chez vous</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Laissez des avis pour aider la communauté</span>
                      </div>
                    </div>
                    <Link href="/profil">
                      <Button size="sm" className="w-full mt-4">
                        Compléter mon profil
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Conseils pour développer votre clientèle
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Ajoutez des photos à vos services</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Proposez des cours collectifs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Optimisez vos disponibilités</span>
                      </div>
                    </div>
                    <Link href="/parametres">
                      <Button size="sm" className="w-full mt-4">
                        Optimiser mon profil
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Notifications ou actualités */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nouveautés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">
                    🎉 Nouveau : Cours collectifs
                  </h4>
                  <p className="text-blue-700">
                    Découvrez les cours de groupe près de chez vous !
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1">
                    📱 Application mobile
                  </h4>
                  <p className="text-green-700">
                    Bientôt disponible sur mobile !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}