// src/app/(dashboard)/cours-collectifs/page.tsx (correction des imports)
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Loader2, Plus, Users, MapPin, Wifi, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { GroupClassForm, type GroupClassFormData } from "@/components/group-classes/group-class-form"
import { GroupSessionForm, type SessionFormData } from "@/components/group-classes/group-session-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GroupClass {
  id: string
  name: string
  description: string
  price: number
  duration: number
  maxParticipants: number
  category: string
  level: string
  isOnline: boolean
  city: string
  address: string
  equipment: string[]
  active: boolean
  sessions: Array<{
    id: string
    startTime: string
    endTime: string
    status: string
    currentParticipants: number
    registrations: { id: string }[]
  }> // Enlever le ? pour que ce soit obligatoire
}

export default function CoursCollectifsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<GroupClass | null>(null)
  const [editingClass, setEditingClass] = useState<GroupClass | null>(null)

  // Charger les cours collectifs
  useEffect(() => {
    const fetchGroupClasses = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        
        const response = await fetch(`/api/users/${session.user.id}/cours-collectifs`)
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des cours collectifs")
        }
        
        const data = await response.json()
        setGroupClasses(data)
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des cours collectifs")
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroupClasses()
  }, [session?.user?.id])

  // Créer un nouveau cours collectif
  const handleCreateGroupClass = async (data: GroupClassFormData) => {
  if (!session?.user?.id) return
  
  try {
    const response = await fetch(`/api/users/${session.user.id}/cours-collectifs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la création du cours collectif")
    }
    
    const result = await response.json()
    
    // S'assurer que sessions existe avec une valeur par défaut
    const newGroupClass = {
      ...result.groupClass,
      sessions: result.groupClass.sessions || [] // Valeur par défaut si undefined
    }
    
    // Ajouter le nouveau cours à la liste
    setGroupClasses(prev => [...prev, newGroupClass])
    setIsFormOpen(false)
    setEditingClass(null)
    
    toast.success("Cours collectif créé avec succès")
  } catch (error) {
    console.error("Erreur:", error)
    throw error
  }
}

  // Modifier un cours collectif
  const handleEditGroupClass = async (data: GroupClassFormData) => {
    if (!session?.user?.id || !editingClass) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/cours-collectifs/${editingClass.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la modification du cours")
      }
      
      const result = await response.json()
      
      // Mettre à jour la liste
      setGroupClasses(prev => 
        prev.map(c => c.id === editingClass.id ? result.groupClass : c)
      )
      setIsFormOpen(false)
      setEditingClass(null)
      
      toast.success("Cours collectif modifié avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  // Supprimer un cours collectif
  const handleDeleteGroupClass = async (groupClass: GroupClass) => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/cours-collectifs/${groupClass.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du cours collectif")
      }
      
      // Retirer de la liste
      setGroupClasses(prev => prev.filter(c => c.id !== groupClass.id))
      
      toast.success("Cours collectif supprimé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du cours collectif")
    }
  }

  // Créer une session pour un cours
  const handleCreateSession = async (data: SessionFormData) => {
    if (!session?.user?.id || !selectedClass) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/cours-collectifs/${selectedClass.id}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la création de la séance")
      }
      
      const result = await response.json()
      
      // Mettre à jour les sessions du cours sélectionné
      setGroupClasses(prev => 
        prev.map(c => 
          c.id === selectedClass.id 
            ? { ...c, sessions: [...c.sessions, result.session] }
            : c
        )
      )
      
      setIsSessionFormOpen(false)
      toast.success("Séance créée avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Cours collectifs"
          description="Gérez vos cours et sessions de groupe"
        />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Cours collectifs"
        description="Gérez vos cours et sessions de groupe"
      >
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau cours collectif
        </Button>
      </PageHeader>

      {groupClasses.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center">
            <div className="mb-4 flex justify-center">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Aucun cours collectif</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Créez votre premier cours collectif pour commencer à proposer des sessions de groupe à vos clients.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer mon premier cours
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupClasses.map((groupClass) => (
            <Card key={groupClass.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {groupClass.isOnline ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <MapPin className="h-5 w-5 text-blue-500" />
                      )}
                      {groupClass.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{groupClass.category}</Badge>
                      <Badge variant="outline">{groupClass.level}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingClass(groupClass)
                        setIsFormOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le cours collectif</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{groupClass.name}" ? 
                            Cette action est irréversible et supprimera également toutes les séances associées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteGroupClass(groupClass)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {groupClass.description}
                  </p>
                  
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-lg">{groupClass.price}€</span>
                    <span className="text-gray-500">{groupClass.duration} min</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Max {groupClass.maxParticipants} personnes
                    </span>
                    {!groupClass.isOnline && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {groupClass.city}
                      </span>
                    )}
                  </div>
                  
                  {groupClass.equipment.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Matériel requis :</p>
                      <div className="flex flex-wrap gap-1">
                        {groupClass.equipment.slice(0, 2).map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {groupClass.equipment.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{groupClass.equipment.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Prochaines séances</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClass(groupClass)
                          setIsSessionFormOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    
                    {groupClass.sessions.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Aucune séance programmée</p>
                    ) : (
                      <div className="space-y-2">
                        {groupClass.sessions.slice(0, 2).map((session) => (
                          <div key={session.id} className="flex justify-between items-center text-xs bg-gray-50 rounded p-2">
                            <span>
                              {format(new Date(session.startTime), 'dd/MM à HH:mm', { locale: fr })}
                            </span>
                            <span className="text-gray-500">
                              {session.currentParticipants}/{groupClass.maxParticipants}
                            </span>
                          </div>
                        ))}
                        {groupClass.sessions.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{groupClass.sessions.length - 2} autres séances
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire de création/modification de cours collectif */}
      <GroupClassForm
        open={isFormOpen}
        onOpenChange={(open: boolean) => {
          setIsFormOpen(open)
          if (!open) setEditingClass(null)
        }}
        onSubmit={editingClass ? handleEditGroupClass : handleCreateGroupClass}
        onCancel={() => {
          setIsFormOpen(false)
          setEditingClass(null)
        }}
        initialData={editingClass || undefined}
      />

      {/* Formulaire de création de session */}
      {selectedClass && (
        <GroupSessionForm
          open={isSessionFormOpen}
          onOpenChange={setIsSessionFormOpen}
          onSubmit={handleCreateSession}
          onCancel={() => setIsSessionFormOpen(false)}
          groupClass={selectedClass}
        />
      )}
    </div>
  )
}