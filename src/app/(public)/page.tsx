// src/app/(public)/page.tsx (mise à jour)
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { geocodeAddress } from "@/lib/utils/geocoding"
import { MapPin, Search, Calendar, BellRing } from "lucide-react"

// Schéma de validation pour le formulaire de recherche
const searchSchema = z.object({
  location: z.string().min(2, "Veuillez entrer une localisation"),
})

type SearchFormValues = z.infer<typeof searchSchema>

export default function HomePage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      location: "",
    }
  })
  
  const onSearch = async (data: SearchFormValues) => {
    setIsSearching(true)
    
    try {
      // Géocoder l'adresse
      const coords = await geocodeAddress(data.location)
      
      if (!coords) {
        toast.error("Impossible de trouver cette localisation. Veuillez être plus précis.")
        return
      }
      
      // Rediriger vers la page de recherche avec les coordonnées
      router.push(`/recherche?lat=${coords.latitude}&lng=${coords.longitude}&location=${encodeURIComponent(data.location)}&distance=20`)
    } catch (error) {
      console.error("Erreur lors de la recherche:", error)
      toast.error("Une erreur est survenue lors de la recherche")
    } finally {
      setIsSearching(false)
    }
  }
  
  return (
    <>
      {/* Hero Section améliorée */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-b from-lavender-light/50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-title font-bold leading-tight text-gray-900">
              Simplicité de réservation pour le
              <span className="text-primary"> bien-être</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Trouvez et réservez facilement des rendez-vous avec des professionnels du bien-être près de chez vous.
            </p>
            
            {/* Formulaire de recherche rapide */}
            <div className="max-w-2xl mx-auto mt-8">
              <form onSubmit={handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Votre ville ou code postal..."
                    className="pl-10 h-12"
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-6" 
                  disabled={isSearching}
                >
                  {isSearching ? "Recherche..." : "Rechercher"}
                  {!isSearching && <Search className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </div>
            
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recherche simplifiée</h3>
              <p className="text-gray-600">
                Trouvez facilement des professionnels du bien-être qualifiés près de chez vous.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Réservation facile</h3>
              <p className="text-gray-600">
                Réservez vos rendez-vous en quelques clics, 24h/24 et 7j/7.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BellRing className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rappels automatiques</h3>
              <p className="text-gray-600">
                Recevez des notifications pour ne jamais manquer vos rendez-vous.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}