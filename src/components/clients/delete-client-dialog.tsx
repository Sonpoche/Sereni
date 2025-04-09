// src/components/clients/delete-client-dialog.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface DeleteClientDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onConfirmDelete: () => Promise<void>
  appointmentsCount: number
}

export function DeleteClientDialog({
  isOpen,
  onOpenChange,
  clientName,
  onConfirmDelete,
  appointmentsCount
}: DeleteClientDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isConfirmDisabled = confirmText !== clientName
  
  const handleDelete = async () => {
    if (isConfirmDisabled) return
    
    setIsSubmitting(true)
    try {
      await onConfirmDelete()
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Réinitialiser l'état du texte de confirmation quand le dialog se ferme
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmText("")
    }
    onOpenChange(open)
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Elle supprimera définitivement le client 
            <strong> {clientName} </strong>
            {appointmentsCount > 0 ? (
              <>
                et ses {appointmentsCount} rendez-vous associés de notre base de données.
              </>
            ) : (
              <>
                de notre base de données.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-2">
          <p className="text-sm text-gray-700">
            Pour confirmer, tapez le nom du client : <strong>{clientName}</strong>
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={clientName}
            className="mt-2"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isConfirmDisabled || isSubmitting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}