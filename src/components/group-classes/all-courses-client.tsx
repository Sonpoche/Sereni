// src/components/group-classes/all-courses-client.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  Wifi,
  Euro,
  Calendar,
  X
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { formatServicePrice } from "@/lib/utils"

interface AllCoursesClientProps {
  currentUser?: any
}

const CATEGORIES = [
  { value: "YOGA", label: "Yoga" },
  { value: "PILATES", label: "Pilates" },
  { value: "FITNESS", label: "Fitness" },
  { value: "MEDITATION", label: "Méditation" },
  { value: "DANSE", label: "Danse" },
  { value: "RELAXATION", label: "Relaxation" },
  { value: "AUTRES", label: "Autres" },
]

const LEVELS = [
  { value: "DEBUTANT", label: "Débutant" },
  { value: "INTERMEDIAIRE", label: "Intermédiaire" },
  { value: "AVANCE", label: "Avancé" },
  { value: "TOUS_NIVEAUX", label: "Tous niveaux" },
]

export default function AllCoursesClient({ currentUser }: AllCoursesClientProps) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined)
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        
        // Construction de l'URL avec les filtres
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (selectedCategory) params.append('category', selectedCategory)
        if (selectedLevel) params.append('level', selectedLevel)
        if (showOnlineOnly) params.append('online', 'true')
        
        const response = await fetch(`/api/cours-collectifs?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des cours:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [searchTerm, selectedCategory, selectedLevel, showOnlineOnly])

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.professional.user.name && course.professional.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.city?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const clearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedLevel(undefined)
    setShowOnlineOnly(false)
    setSearchTerm("")
  }

  const hasActiveFilters = selectedCategory || selectedLevel || showOnlineOnly || searchTerm

  return (
    <div className="container mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-title font-bold mb-4">
          Cours collectifs de bien-être
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez une large sélection de cours collectifs près de chez vous. 
          Yoga, pilates, méditation et bien plus encore !
        </p>
      </div>

      {/* Filtres */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Tout effacer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche textuelle */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un cours, praticien, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtre par catégorie */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtre par niveau */}
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtre cours en ligne */}
            <Button
              variant={showOnlineOnly ? "default" : "outline"}
              onClick={() => setShowOnlineOnly(!showOnlineOnly)}
              className="flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              En ligne uniquement
            </Button>
          </div>
          
          {/* Affichage des filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600 font-medium">Filtres actifs :</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: "{searchTerm}"
                  <button onClick={() => setSearchTerm("")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedLevel && (
                <Badge variant="secondary" className="gap-1">
                  {LEVELS.find(l => l.value === selectedLevel)?.label}
                  <button onClick={() => setSelectedLevel(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {showOnlineOnly && (
                <Badge variant="secondary" className="gap-1">
                  En ligne uniquement
                  <button onClick={() => setShowOnlineOnly(false)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des cours */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun cours trouvé</h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? "Essayez de modifier vos critères de recherche ou explorez d'autres catégories."
                : "Aucun cours collectif n'est disponible pour le moment."
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Effacer tous les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              {filteredCourses.length} cours trouvé{filteredCourses.length > 1 ? 's' : ''}
              {hasActiveFilters && ` (${courses.length} au total)`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {course.isOnline ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <MapPin className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {course.isOnline ? "En ligne" : course.city}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {formatServicePrice(course.price)}
                      </div>
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  
                  <div className="flex gap-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {course.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Max {course.maxParticipants}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Avec {course.professional.user.name || "Praticien"}</strong>
                  </div>
                  
                  {course.sessions && course.sessions.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Prochaines séances :
                      </div>
                      <div className="space-y-1">
                        {course.sessions.slice(0, 2).map((session: any) => (
                          <div key={session.id} className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(session.startTime), 'dd/MM à HH:mm', { locale: fr })}
                            <span className="text-gray-400">
                              ({course.maxParticipants - (session.registrations?.length || 0)} places)
                            </span>
                          </div>
                        ))}
                        {course.sessions.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{course.sessions.length - 2} autres séances
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Link href={`/cours-collectifs/${course.id}`}>
                    <Button className="w-full">
                      Voir les détails
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}