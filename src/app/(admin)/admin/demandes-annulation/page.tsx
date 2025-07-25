// src/app/(admin)/admin/demandes-annulation/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  CreditCard
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface CancelationRequest {
  id: string
  reason: string
  feedback?: string
  contactPreference: string
  status: 'pending' | 'approved' | 'denied' | 'resolved'
  adminResponse?: string
  requestedAt: string
  processedAt?: string
  user: {
    id: string
    name: string
    email: string
  }
  subscription: {
    id: string
    plan: 'standard' | 'premium'
    currentPeriodEnd?: string
    mrr: number
  }
}

export default function DemandesAnnulationPage() {
  const [requests, setRequests] = useState<CancelationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<CancelationRequest | null>(null)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [adminResponse, setAdminResponse] = useState("")

  useEffect(() => {
    fetchCancelationRequests()
  }, [filter])

  const fetchCancelationRequests = async () => {
    try {
      const response = await fetch(`/api/admin/cancelation-requests?filter=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      } else {
        // Données de démonstration
        setRequests([
          {
            id: "req_1",
            reason: "Prix trop élevé",
            feedback: "J'ai trouvé une solution moins chère chez un concurrent. Le service est bien mais le budget est serré en ce moment.",
            contactPreference: "email",
            status: "pending",
            requestedAt: "2025-01-20T10:30:00Z",
            user: {
              id: "user_1",
              name: "Marie Dubois",
              email: "marie.dubois@email.com"
            },
            subscription: {
              id: "sub_1",
              plan: "premium",
              currentPeriodEnd: "2025-02-15T00:00:00Z",
              mrr: 40
            }
          },
          {
            id: "req_2",
            reason: "Fonctionnalités manquantes",
            feedback: "Il manque l'intégration avec mon logiciel comptable. C'est indispensable pour mon activité.",
            contactPreference: "phone",
            status: "pending",
            requestedAt: "2025-01-19T15:45:00Z",
            user: {
              id: "user_2",
              name: "Pierre Martin",
              email: "pierre.martin@email.com"
            },
            subscription: {
              id: "sub_2",
              plan: "standard",
              currentPeriodEnd: "2025-02-10T00:00:00Z",
              mrr: 20
            }
          },
          {
            id: "req_3",
            reason: "Arrêt d'activité",
            feedback: "Je ferme mon cabinet pour prendre une retraite anticipée. Merci pour vos services.",
            contactPreference: "email",
            status: "pending",
            requestedAt: "2025-01-18T09:15:00Z",
            user: {
              id: "user_3",
              name: "Sophie Laurent",
              email: "sophie.laurent@email.com"
            },
            subscription: {
              id: "sub_3",
              plan: "premium",
              currentPeriodEnd: "2025-02-20T00:00:00Z",
              mrr: 40
            }
          }
        ])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      toast.error("Erreur lors du chargement des demandes")
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'deny', response: string) => {
    setProcessingRequest(requestId)
    
    try {
      const apiResponse = await fetch(`/api/admin/cancelation-requests/${requestId}/process`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminResponse: response
        })
      })

      if (apiResponse.ok) {
        const result = await apiResponse.json()
        
        // Mettre à jour la liste
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: action === 'approve' ? 'approved' : 'denied',
                adminResponse: response,
                processedAt: new Date().toISOString()
              }
            : req
        ))

        toast.success(
          action === 'approve' 
            ? "Demande approuvée - L'abonnement sera annulé à la fin de la période"
            : "Demande refusée - L'utilisateur a été notifié"
        )

        setSelectedRequest(null)
        setAdminResponse("")
      } else {
        const error = await apiResponse.json()
        toast.error(error.message || "Erreur lors du traitement")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du traitement de la demande")
    } finally {
      setProcessingRequest(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approuvée</Badge>
      case 'denied':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Refusée</Badge>
      case 'resolved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Résolue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getContactIcon = (preference: string) => {
    switch (preference) {
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === 'pending'
    if (filter === 'processed') return req.status !== 'pending'
    return true
  })

  const pendingCount = requests.filter(req => req.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-title font-bold text-gray-900">
            Demandes d'annulation
          </h1>
          <p className="text-gray-600">
            Gérez les demandes d'annulation d'abonnement des utilisateurs
          </p>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente
            </span>
          </div>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">Filtrer par statut :</span>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente ({requests.filter(r => r.status === 'pending').length})</SelectItem>
                <SelectItem value="processed">Traitées ({requests.filter(r => r.status !== 'pending').length})</SelectItem>
                <SelectItem value="all">Toutes ({requests.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'pending' ? 'Demandes en attente' : 
             filter === 'processed' ? 'Demandes traitées' : 'Toutes les demandes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune demande {filter === 'pending' ? 'en attente' : 'trouvée'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.user.name}</div>
                        <div className="text-sm text-gray-500">{request.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <Badge variant={request.subscription.plan === 'premium' ? 'default' : 'secondary'}>
                          {request.subscription.plan === 'premium' ? 'Premium' : 'Standard'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {request.subscription.mrr}€/mois
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getContactIcon(request.contactPreference)}
                        <span className="text-sm capitalize">{request.contactPreference}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(request.requestedAt), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            {request.status === 'pending' ? 'Traiter' : 'Voir détails'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Demande d'annulation - {request.user.name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedRequest?.id === request.id && (
                            <RequestDetails
                              request={selectedRequest}
                              onProcess={handleProcessRequest}
                              adminResponse={adminResponse}
                              setAdminResponse={setAdminResponse}
                              isProcessing={processingRequest === request.id}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Composant pour les détails de la demande
interface RequestDetailsProps {
  request: CancelationRequest
  onProcess: (requestId: string, action: 'approve' | 'deny', response: string) => void
  adminResponse: string
  setAdminResponse: (response: string) => void
  isProcessing: boolean
}

function RequestDetails({ 
  request, 
  onProcess, 
  adminResponse, 
  setAdminResponse, 
  isProcessing 
}: RequestDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Informations utilisateur */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-500">UTILISATEUR</h3>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{request.user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{request.user.email}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-500">ABONNEMENT</h3>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <Badge variant={request.subscription.plan === 'premium' ? 'default' : 'secondary'}>
              {request.subscription.plan === 'premium' ? 'Premium' : 'Standard'}
            </Badge>
            <span className="text-sm">{request.subscription.mrr}€/mois</span>
          </div>
          {request.subscription.currentPeriodEnd && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Expire le {format(new Date(request.subscription.currentPeriodEnd), 'dd/MM/yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Détails de la demande */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Raison de l'annulation</h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="font-medium text-red-600">{request.reason}</span>
          </div>
        </div>

        {request.feedback && (
          <div>
            <h3 className="font-medium mb-2">Commentaires</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm">{request.feedback}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-medium mb-2">Préférence de contact</h3>
          <div className="flex items-center gap-2">
            {request.contactPreference === 'phone' ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            <span className="capitalize">{request.contactPreference}</span>
          </div>
        </div>
      </div>

      {request.status === 'pending' ? (
        // Actions pour traiter la demande
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Réponse admin</h3>
            <Textarea
              placeholder="Écrivez votre réponse à l'utilisateur..."
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => onProcess(request.id, 'approve', adminResponse)}
              disabled={!adminResponse.trim() || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Traitement...' : 'Approuver l\'annulation'}
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => onProcess(request.id, 'deny', adminResponse)}
              disabled={!adminResponse.trim() || isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Traitement...' : 'Refuser la demande'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 rounded p-2">
            💡 <strong>Approuver</strong> : L'abonnement sera annulé à la fin de la période de facturation. 
            <strong>Refuser</strong> : L'abonnement continue normalement.
          </div>
        </div>
      ) : (
        // Affichage du traitement déjà effectué
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Statut</h3>
            <div className="flex items-center gap-2">
              {request.status === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                Demande {request.status === 'approved' ? 'approuvée' : 'refusée'}
              </span>
              {request.processedAt && (
                <span className="text-sm text-gray-500">
                  le {format(new Date(request.processedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </span>
              )}
            </div>
          </div>

          {request.adminResponse && (
            <div>
              <h3 className="font-medium mb-2">Réponse envoyée</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm">{request.adminResponse}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}