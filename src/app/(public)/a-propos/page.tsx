// src/app/(public)/a-propos/page.tsx
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Heart, 
  Users, 
  Target, 
  Star, 
  Calendar,
  Shield,
  Lightbulb,
  Award
} from "lucide-react"

export const metadata: Metadata = {
  title: "À propos - Notre mission pour les professionnels du bien-être | SereniBook",
  description: "Découvrez comment SereniBook aide les professionnels du bien-être à développer leur activité avec une solution de réservation simple et efficace.",
}

const values = [
  {
    icon: Heart,
    title: "Passion du bien-être",
    description: "Nous croyons profondément aux bienfaits des pratiques de bien-être et soutenons ceux qui les partagent."
  },
  {
    icon: Users,
    title: "Simplicité d'usage",
    description: "Des outils intuitifs qui permettent aux praticiens de se concentrer sur leur cœur de métier."
  },
  {
    icon: Shield,
    title: "Fiabilité totale",
    description: "Une plateforme sécurisée et stable sur laquelle vous pouvez compter au quotidien."
  },
  {
    icon: Lightbulb,
    title: "Innovation continue",
    description: "Nous évoluons constamment pour répondre aux besoins changeants du secteur."
  }
]

const stats = [
  { number: "500+", label: "Praticiens nous font confiance" },
  { number: "10k+", label: "Rendez-vous gérés par mois" },
  { number: "98%", label: "Taux de satisfaction client" },
  { number: "24/7", label: "Support en français" }
]

const team = [
  {
    name: "Marie Dubois",
    role: "Fondatrice & CEO",
    description: "Ancienne coach bien-être, Marie a créé SereniBook pour simplifier la vie des praticiens.",
    image: "/images/team/marie.jpg" // Placeholder
  },
  {
    name: "Thomas Martin",
    role: "CTO",
    description: "Expert en développement web, passionné par les solutions qui font vraiment la différence.",
    image: "/images/team/thomas.jpg" // Placeholder
  },
  {
    name: "Sophie Laurent",
    role: "Responsable Client",
    description: "Ancienne praticienne, elle comprend parfaitement les défis du secteur bien-être.",
    image: "/images/team/sophie.jpg" // Placeholder
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-lavender-light/30 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-title font-bold text-gray-900 mb-6">
              Notre mission : simplifier votre réussite
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              SereniBook est née de la volonté d'accompagner les professionnels du bien-être 
              dans le développement de leur activité, avec des outils simples et efficaces.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/inscription">
                <Button size="lg" className="h-12">
                  Essayer gratuitement
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="h-12">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-title font-bold text-gray-900 mb-6">
                  Une solution pensée par et pour les praticiens
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    SereniBook est née en 2024 d'un constat simple : les professionnels du bien-être 
                    passent trop de temps sur la gestion administrative au détriment de leur véritable passion.
                  </p>
                  <p>
                    Notre fondatrice, Marie Dubois, coach en développement personnel depuis 8 ans, 
                    a vécu ces frustrations au quotidien. Entre les appels pour prendre rendez-vous, 
                    la gestion des annulations et la facturation, il ne restait plus assez de temps 
                    pour accompagner ses clients.
                  </p>
                  <p>
                    C'est de cette expérience qu'est née SereniBook : une plateforme qui automatise 
                    les tâches répétitives pour que chaque praticien puisse se concentrer sur 
                    ce qu'il fait de mieux.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary/20 to-lavender-light/20 rounded-2xl p-8">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <Calendar className="h-12 w-12 text-primary mb-4" />
                    <h3 className="font-title font-semibold text-lg mb-2">
                      Plus de temps pour l'essentiel
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Automatisez votre gestion et retrouvez jusqu'à 10h par semaine 
                      pour vous concentrer sur vos clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-title font-bold text-gray-900 mb-4">
                Nos valeurs nous guident
              </h2>
              <p className="text-xl text-gray-600">
                Chaque décision que nous prenons est alignée avec ces principes fondamentaux
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon
                return (
                  <Card key={index} className="border-0 bg-white shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-title font-semibold text-lg mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-title font-bold mb-4">
                Des résultats qui parlent
              </h2>
              <p className="text-xl text-primary-light">
                La confiance de nos utilisateurs est notre plus belle récompense
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-primary-light">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-title font-bold text-gray-900 mb-4">
                Une équipe passionnée
              </h2>
              <p className="text-xl text-gray-600">
                Des experts qui comprennent vos défis et travaillent chaque jour pour vous accompagner
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="border-0 shadow-lg overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-lavender-light to-primary/20 flex items-center justify-center">
                    <Users className="h-20 w-20 text-primary/60" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-title font-semibold text-xl mb-1">
                      {member.name}
                    </h3>
                    <div className="text-primary font-medium mb-3">
                      {member.role}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-title font-bold text-gray-900 mb-4">
                Pourquoi choisir SereniBook ?
              </h2>
              <p className="text-xl text-gray-600">
                Une solution française qui comprend vraiment vos besoins
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Expertise du secteur bien-être</h3>
                    <p className="text-gray-600">
                      Notre équipe comprend les spécificités et défis uniques de votre métier.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Conformité RGPD</h3>
                    <p className="text-gray-600">
                      Vos données et celles de vos clients sont protégées selon les standards européens.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Support humain en français</h3>
                    <p className="text-gray-600">
                      Une équipe dédiée pour vous accompagner, dans votre langue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Tarifs transparents</h3>
                    <p className="text-gray-600">
                      Pas de frais cachés, pas de commissions sur vos ventes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Évolution continue</h3>
                    <p className="text-gray-600">
                      Nouvelles fonctionnalités régulières basées sur vos retours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Innovation constante</h3>
                    <p className="text-gray-600">
                      Technologies modernes pour une expérience utilisateur optimale.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-title font-bold mb-6">
              Prêt à transformer votre activité ?
            </h2>
            <p className="text-xl text-primary-light mb-8">
              Rejoignez des centaines de praticiens qui ont choisi SereniBook 
              pour développer leur activité bien-être.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/inscription">
                <Button size="lg" variant="secondary" className="h-12">
                  Commencer l'essai gratuit
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-12 border-white text-white hover:bg-white hover:text-primary">
                  Voir une démonstration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}