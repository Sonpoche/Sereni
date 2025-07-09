// src/app/(dashboard)/parametres/notifications/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, MessageSquare, Bell, Save } from "lucide-react"
import { toast } from "sonner"

interface NotificationSettings {
  id?: string
  emailEnabled: boolean
  smsEnabled: boolean
  reminderHours: number
  cancelationNotifications: boolean
  newBookingNotifications: boolean
  reminderNotifications: boolean
  emailSignature: string
  defaultCancelationReason: string
  autoConfirmCancelations: boolean
}

export default function ParametresNotificationsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    reminderHours: 24,
    cancelationNotifications: true,
    newBookingNotifications: true,
    reminderNotifications: true,
    emailSignature: "",
    defaultCancelationReason: "Raisons personnelles",
    autoConfirmCancelations: false
  })

  // Charger les paramètres de notification
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.id) return
      
      try {
        setLoading(true)
        
        const response = await fetch(`/api/users/${session.user.id}/parametres/notifications`)
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des paramètres")
        }
        
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement des paramètres")
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [session?.user?.id])

  // Sauvegarder les paramètres
  const handleSave = async () => {
    if (!session?.user?.id) return
    
    try {
      setSaving(true)
      
      const response = await fetch(`/api/users/${session.user.id}/parametres/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la sauvegarde")
      }
      
      const result = await response.json()
      
      // Mettre à jour les paramètres avec la réponse du serveur
      if (result.settings) {
        setSettings(result.settings)
      }
      
      toast.success("Paramètres sauvegardés avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error((error as Error).message || "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Paramètres des notifications"
          description="Configurez vos préférences de notifications"
        />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <PageHeader
        title="Paramètres des notifications"
        description="Configurez vos préférences de notifications et d'emails"
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </PageHeader>

      <div className="space-y-6">
        {/* Paramètres généraux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications générales
            </CardTitle>
            <CardDescription>
              Activez ou désactivez les différents types de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailEnabled">Notifications par email</Label>
                <div className="text-sm text-muted-foreground">
                  Recevoir des notifications par email pour les événements importants
                </div>
              </div>
              <Switch
                id="emailEnabled"
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, emailEnabled: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="newBookingNotifications">Nouvelles réservations</Label>
                <div className="text-sm text-muted-foreground">
                  Être notifié lors de nouvelles réservations de clients
                </div>
              </div>
              <Switch
                id="newBookingNotifications"
                checked={settings.newBookingNotifications}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, newBookingNotifications: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cancelationNotifications">Annulations de cours/séances</Label>
                <div className="text-sm text-muted-foreground">
                  Envoyer automatiquement des emails lors d'annulations
                </div>
              </div>
              <Switch
                id="cancelationNotifications"
                checked={settings.cancelationNotifications}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, cancelationNotifications: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminderNotifications">Rappels automatiques</Label>
                <div className="text-sm text-muted-foreground">
                  Envoyer des rappels automatiques aux clients avant les séances
                </div>
              </div>
              <Switch
                id="reminderNotifications"
                checked={settings.reminderNotifications}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, reminderNotifications: checked }))
                }
              />
            </div>

            {settings.reminderNotifications && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="reminderHours">Délai de rappel (heures avant la séance)</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.reminderHours}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, reminderHours: parseInt(e.target.value) || 24 }))
                  }
                  className="w-32"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paramètres des emails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Paramètres des emails
            </CardTitle>
            <CardDescription>
              Personnalisez le contenu de vos emails automatiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailSignature">Signature email</Label>
              <Textarea
                id="emailSignature"
                placeholder="Cordialement,&#10;[Votre nom]&#10;[Votre profession]&#10;[Vos coordonnées]"
                value={settings.emailSignature}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, emailSignature: e.target.value }))
                }
                rows={4}
              />
              <div className="text-sm text-muted-foreground">
                Cette signature sera ajoutée automatiquement à tous vos emails
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="defaultCancelationReason">Raison d'annulation par défaut</Label>
              <Input
                id="defaultCancelationReason"
                placeholder="Raisons personnelles"
                value={settings.defaultCancelationReason}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, defaultCancelationReason: e.target.value }))
                }
              />
              <div className="text-sm text-muted-foreground">
                Raison affichée par défaut dans les emails d'annulation
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoConfirmCancelations">Confirmation automatique des annulations</Label>
                <div className="text-sm text-muted-foreground">
                  Envoyer automatiquement les emails sans demander confirmation
                </div>
              </div>
              <Switch
                id="autoConfirmCancelations"
                checked={settings.autoConfirmCancelations}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, autoConfirmCancelations: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS (pour plus tard) */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notifications SMS
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">Bientôt disponible</span>
            </CardTitle>
            <CardDescription>
              Envoyez des notifications SMS à vos clients (fonctionnalité prochainement disponible)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smsEnabled">Notifications SMS</Label>
                <div className="text-sm text-muted-foreground">
                  Envoyer des SMS pour les rappels et annulations
                </div>
              </div>
              <Switch
                id="smsEnabled"
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, smsEnabled: checked }))
                }
                disabled
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}