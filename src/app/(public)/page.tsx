// src/app/(public)/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-title font-bold leading-tight text-gray-900">
              Simplicité de réservation pour le
              <span className="text-primary"> bien-être</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Gérez vos rendez-vous en toute sérénité. La solution idéale pour les professionnels du bien-être et leurs clients.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link href="/register?role=professional">
                <Button size="lg">
                  Je suis professionnel
                </Button>
              </Link>
              <Link href="/register?role=client">
                <Button variant="outline" size="lg">
                  Je suis client
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-title font-bold text-center mb-12">
            Une plateforme pensée pour vous
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Réservation simplifiée</h3>
              <p className="text-gray-600">
                Gérez vos rendez-vous en quelques clics et permettez à vos clients de réserver 24/7.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Gestion efficace</h3>
              <p className="text-gray-600">
                Suivez vos rendez-vous, gérez vos disponibilités et vos services facilement.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Communication fluide</h3>
              <p className="text-gray-600">
                Notifications automatiques, rappels et confirmations pour ne rien manquer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}