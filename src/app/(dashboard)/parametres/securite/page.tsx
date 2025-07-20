// src/app/(dashboard)/parametres/securite/page.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle,
  AlertTriangle,
  Clock,
  LogOut,
  Trash2,
  Download
} from "lucide-react"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface LoginSession {
  id: string
  device: string
  location: string
  ip: string
  lastActive: string
  current: boolean
}

const mockSessions: LoginSession[] = [
  {
    id: "1",
    device: "Chrome sur Windows",
    location: "Paris, France",
    ip: "192.168.1.100",
    lastActive: "2024-07-20T14:30:00Z",
    current: true
  },
  {
    id: "2", 
    device: "Safari sur iPhone",
    location: "Paris, France",
    ip: "192.168.1.101",
    lastActive: "2024-07-19T09:15:00Z",
    current: false
  },
  {
    id: "3",
    device: "Firefox sur MacOS",
    location: "Lyon, France", 
    ip: "192.168.1.102",
    lastActive: "2024-07-18T16:45:00Z",
    current: false
  }
]

export default function SecuritePage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sessions] = useState<LoginSession[]>(mockSessions)
  
  // États pour les options de sécurité
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loginNotifications, setLoginNotifications] = useState(true)
  const [autoLogout, setAutoLogout] = useState(30)
  const [passwordlessLogin, setPasswordlessLogin] = useState(false)

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      if (response.ok) {
        setSaveSuccess(true)
        passwordForm.reset()
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const error = await response.json()
        passwordForm.setError('currentPassword', { message: error.message })
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      // Actualiser la liste des sessions
      window.location.reload()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleLogoutAllSessions = async () => {
    if (!confirm('Voulez-vous vraiment vous déconnecter de tous les appareils ?')) return

    try {
      await fetch('/api/auth/sessions/logout-all', {
        method: 'POST'
      })
      // Rediriger vers la page de connexion
      window.location.href = '/connexion'
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleEnable2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST'
      })
      const { qrCode, secret } = await response.json()
      
      // Afficher le QR code dans une modal (à implémenter)
      console.log('QR Code:', qrCode)
    } catch (error) {
      console.error('Erreur activation 2FA:', error)
    }
  }

  const handleDownloadBackupCodes = async () => {
    try {
      const response = await fetch('/api/auth/2fa/backup-codes')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'codes-secours-serenibook.txt'
      a.click()
    } catch (error) {
      console.error('Erreur téléchargement codes:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-title font-bold text-gray-900">
          Sécurité et confidentialité
        </h1>
        <p className="text-gray-600 mt-2">
          Protégez votre compte et vos données
        </p>
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Paramètres de sécurité mis à jour avec succès !
          </AlertDescription>
        </Alert>
      )}

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Modifier le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...passwordForm.register("currentPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...passwordForm.register("newPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...passwordForm.register("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Modification...
                </div>
              ) : (
                "Changer le mot de passe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Authentification à deux facteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Activer la 2FA</h3>
              <p className="text-sm text-gray-600">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={async (checked) => {
                if (checked) {
                  await handleEnable2FA()
                }
                setTwoFactorEnabled(checked)
              }}
            />
          </div>

          {twoFactorEnabled && (
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>Authentification à deux facteurs activée</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBackupCodes}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Codes de secours
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!twoFactorEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nous recommandons fortement d'activer l'authentification à deux facteurs 
                pour protéger votre compte contre les accès non autorisés.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Options de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Options de sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Notifications de connexion</h3>
              <p className="text-sm text-gray-600">
                Recevoir un email lors des nouvelles connexions
              </p>
            </div>
            <Switch
              checked={loginNotifications}
              onCheckedChange={setLoginNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Connexion sans mot de passe</h3>
              <p className="text-sm text-gray-600">
                Se connecter uniquement par email (liens magiques)
              </p>
            </div>
            <Switch
              checked={passwordlessLogin}
              onCheckedChange={setPasswordlessLogin}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium">Déconnexion automatique</h3>
                <p className="text-sm text-gray-600">
                  Se déconnecter automatiquement après inactivité
                </p>
              </div>
              <select
                value={autoLogout}
                onChange={(e) => setAutoLogout(Number(e.target.value))}
                className="border rounded-md px-3 py-1"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
                <option value={240}>4 heures</option>
                <option value={0}>Jamais</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions actives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Sessions actives
            </CardTitle>
            <Button variant="outline" onClick={handleLogoutAllSessions}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnecter tout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{session.device}</span>
                  {session.current && (
                    <Badge variant="secondary">Session actuelle</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {session.location} • IP: {session.ip}
                </p>
                <p className="text-xs text-gray-500">
                  Dernière activité: {new Date(session.lastActive).toLocaleString('fr-FR')}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLogoutSession(session.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suppression de compte */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Zone dangereuse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              La suppression de votre compte est irréversible et entraînera la perte 
              de toutes vos données (clients, rendez-vous, factures, etc.).
            </AlertDescription>
          </Alert>

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Supprimer mon compte</h3>
              <p className="text-sm text-gray-600">
                Supprimer définitivement votre compte et toutes les données associées
              </p>
            </div>
            <Button variant="destructive">
              Supprimer le compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}