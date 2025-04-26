// src/app/(public)/recherche/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Search, Clock, User } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ProfessionalType, professionalTypeLabels } from "@/types/professional"
import { geocodeAddress } from "@/lib/utils/geocoding"

// Fonction pour géolocaliser l'utilisateur
const getUserLocation = (): Promise<{lat: number, lng: number}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas supportée par votre navigateur"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export default function RecherchePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState("");
  const [specialite, setSpecialite] = useState<string>("all");
  const [distance, setDistance] = useState<string>("20");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGeolocalizing, setIsGeolocalizing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  
  // Charger les paramètres de l'URL
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const loc = searchParams.get('location');
    const spec = searchParams.get('specialite');
    const dist = searchParams.get('distance');
    
    if (lat && lng) {
      setLatitude(parseFloat(lat));
      setLongitude(parseFloat(lng));
    }
    
    if (loc) setLocation(loc);
    if (spec) setSpecialite(spec);
    if (dist) setDistance(dist);
    
    // Si on a tous les paramètres nécessaires, lancer la recherche
    if (lat && lng && dist) {
      searchProfessionals(parseFloat(lat), parseFloat(lng), dist, spec || undefined);
    }
  }, [searchParams]);
  
  // Fonction de géolocalisation
  const handleGeolocate = async () => {
    setIsGeolocalizing(true);
    try {
      const position = await getUserLocation();
      setLatitude(position.lat);
      setLongitude(position.lng);
      setLocation("Ma position actuelle");
      toast.success("Position localisée avec succès");
    } catch (error) {
      console.error("Erreur de géolocalisation:", error);
      toast.error("Impossible de récupérer votre position. Veuillez saisir une adresse manuellement.");
    } finally {
      setIsGeolocalizing(false);
    }
  };
  
  // Fonction de recherche
  const searchProfessionals = async (lat: number, lng: number, dist: string, spec?: string) => {
    setIsSearching(true);
    try {
      // Construire l'URL de recherche
      let searchUrl = `/api/recherche/professionnels?lat=${lat}&lng=${lng}&distance=${dist}`;
      if (spec && spec !== "all") searchUrl += `&specialite=${spec}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la recherche des professionnels");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Fonction de validation du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si on n'a pas les coordonnées, essayer de les obtenir
    if (!latitude || !longitude) {
      if (!location) {
        toast.error("Veuillez indiquer une localisation");
        return;
      }
      
      setIsSearching(true);
      try {
        const coords = await geocodeAddress(location);
        if (!coords) {
          toast.error("Impossible de trouver cette adresse. Veuillez être plus précis.");
          setIsSearching(false);
          return;
        }
        
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        
        // Mettre à jour l'URL avec les paramètres de recherche
        const params = new URLSearchParams();
        params.set('lat', coords.latitude.toString());
        params.set('lng', coords.longitude.toString());
        params.set('location', location);
        params.set('distance', distance);
        if (specialite && specialite !== "all") params.set('specialite', specialite);
        
        router.push(`/recherche?${params.toString()}`);
        
        // Lancer la recherche
        searchProfessionals(coords.latitude, coords.longitude, distance, specialite !== "all" ? specialite : undefined);
      } catch (error) {
        console.error("Erreur de géocodage:", error);
        toast.error("Erreur lors de la recherche de l'adresse");
        setIsSearching(false);
      }
    } else {
      // Mettre à jour l'URL avec les paramètres de recherche
      const params = new URLSearchParams();
      params.set('lat', latitude.toString());
      params.set('lng', longitude.toString());
      params.set('location', location);
      params.set('distance', distance);
      if (specialite && specialite !== "all") params.set('specialite', specialite);
      
      router.push(`/recherche?${params.toString()}`);
      
      // Lancer la recherche
      searchProfessionals(latitude, longitude, distance, specialite !== "all" ? specialite : undefined);
    }
  };
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-title font-medium text-center mb-8">
          Trouvez un professionnel du bien-être près de chez vous
        </h1>
        
        {/* Formulaire de recherche */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Votre localisation</label>
                  <div className="flex">
                    <Input
                      placeholder="Votre ville ou code postal"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="rounded-r-none"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleGeolocate}
                      className="rounded-l-none" 
                      disabled={isGeolocalizing}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de professionnel</label>
                  <Select value={specialite} onValueChange={setSpecialite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les professionnels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les professionnels</SelectItem>
                      {Object.entries(professionalTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Distance maximale</label>
                <div className="flex items-center">
                  <Input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="flex-1 mr-3"
                  />
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="inline-block">{distance} <span className="text-xs">km</span></span>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSearching || (!location && !latitude)}
              >
                {isSearching ? "Recherche en cours..." : "Rechercher"}
                {!isSearching && <Search className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Résultats de recherche */}
        {results.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-medium">
              {results.length} professionnel{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((professional) => (
                <Link 
                  key={professional.id} 
                  href={`/professionnels/${professional.user.id}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium">{professional.user.name}</h3>
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          {professional.distance} km
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        {professionalTypeLabels[professional.type as ProfessionalType] || professional.type}
                      </div>
                      
                      <div className="mt-4 flex items-center text-sm text-gray-500 gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{professional.city} {professional.postalCode}</span>
                      </div>
                      
                      {/* Services disponibles sans afficher les prix */}
                      {professional.services && professional.services.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-sm text-gray-500">
                            {professional.services.length} service{professional.services.length > 1 ? 's' : ''} disponible{professional.services.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                      
                      <Button className="w-full mt-4" variant="outline" size="sm">
                        Voir le profil
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {isSearching && (
          <div className="mt-8 text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Recherche des professionnels en cours...</p>
          </div>
        )}
        
        {!isSearching && results.length === 0 && searchParams.has('lat') && (
          <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Aucun professionnel trouvé</h3>
            <p className="text-gray-500 mb-4">
              Essayez d'élargir votre zone de recherche ou de modifier vos critères.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}