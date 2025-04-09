// src/components/clients/add-client-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AddClientForm } from "./add-client-form"
import { type Client } from "./clients-container"

interface AddClientButtonProps {
  onClientAdded: (client: Client) => void
}

export function AddClientButton({ onClientAdded }: AddClientButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  return (
    <>
      <Button 
        onClick={() => setIsFormOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Ajouter un client
      </Button>
      
      <AddClientForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onClientAdded={onClientAdded}
      />
    </>
  )
}