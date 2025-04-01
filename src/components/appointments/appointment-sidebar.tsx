// src/components/appointments/appointment-sidebar.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  UserPlus,
  CircleOff,
  PlusCircle
} from "lucide-react"

export default function AppointmentSidebar() {
  const [activeTab, setActiveTab] = useState("options")
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="options" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="options" className="flex-1">Options</TabsTrigger>
          <TabsTrigger value="details" className="flex-1">Détails</TabsTrigger>
        </TabsList>
        
        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouveau rendez-vous
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Nouveau client
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CircleOff className="mr-2 h-4 w-4" />
                Bloquer une plage
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Filtrer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options de filtrage */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Services</label>
                {/* Checkboxes for services would go here */}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                {/* Statuses selection would go here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Détails du rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Sélectionnez un rendez-vous dans le calendrier pour voir ses détails
              </p>
              
              {/* Placeholder for appointment details */}
              {/* Will be populated when an appointment is selected */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}