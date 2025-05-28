// src/app/(dashboard)/parametres/localisation/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MapPin, Settings } from "lucide-react"

export default function LocalisationSettings() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState({
    maxDistance: 25,
    showOnlineCourses: true
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    // Logique de sauvegarde
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Préférences de localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="maxDistance">Distance maximale (km)</Label>
            <Input
              id="maxDistance"
              type="number"
              value={settings.maxDistance}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maxDistance: parseInt(e.target.value) || 25
              }))}
            />
            <p className="text-sm text-gray-500 mt-1">
              Distance maximale pour afficher les cours collectifs
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Cours en ligne</Label>
              <p className="text-sm text-gray-500">
                Afficher les cours collectifs en ligne
              </p>
            </div>
            <Switch
              checked={settings.showOnlineCourses}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                showOnlineCourses: checked
              }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}