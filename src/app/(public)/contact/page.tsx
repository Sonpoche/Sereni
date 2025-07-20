// src/app/(public)/contact/page.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Send,
  MapPin,
  Users,
  HelpCircle,
  CreditCard,
  Globe,
  Loader2,
  Calendar
} from "lucide-react"
import { toast } from "sonner"

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  userType: z.string().min(1, "Veuillez préciser votre profil")
})

type ContactFormValues = z.infer<typeof contactSchema>

const subjects = [
  { value: "support", label: "Support technique" },
  { value: "billing", label: "Facturation et abonnement" },
  { value: "features", label: "Demande de fonctionnalité" },
  { value: "partnership", label: "Partenariat" },
  { value: "press", label: "Presse et médias" },
  { value: "other", label: "Autre" }
]

const userTypes = [
  { value: "professional", label: "Professionnel du bien-être" },
  { value: "client", label: "Client particulier" },
  { value: "prospect", label: "Prospect (future inscription)" },
  { value: "partner", label: "Partenaire potentiel" },
  { value: "press", label: "Journaliste/Média" }
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      userType: ""
    }
  })

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message")
      }

      setIsSubmitted(true)
      toast.success("Message envoyé avec succès !")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender-light/30 to-white">
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Message envoyé avec succès !
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-blue-800 mb-2">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Temps de réponse moyen</span>
              </div>
              <p className="text-blue-700">
                • Support technique : 24h<br/>
                • Questions commerciales : 4h<br/>
                • Demandes urgentes : 2h
              </p>
            </div>
            <Button onClick={() => setIsSubmitted(false)} className="mr-4">
              Envoyer un autre message
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-light/30 to-white">
      <div className="container mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-title font-bold text-gray-900 mb-6">
            Nous sommes là pour vous aider
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Une question ? Un problème ? Notre équipe vous accompagne pour développer 
            votre activité bien-être en toute sérénité.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Formulaire de contact - 2/3 */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  Envoyez-nous un message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Nom complet</FormLabel>
                            <FormControl>
                              <Input placeholder="Jean Dupont" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="jean@exemple.fr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone (optionnel)</FormLabel>
                            <FormControl>
                              <Input placeholder="06 12 34 56 78" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Votre profil</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez votre profil" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {userTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Sujet</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisissez le sujet de votre message" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.value} value={subject.value}>
                                  {subject.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez votre demande en détail..."
                              className="min-h-[120px] resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Informations de contact - 1/3 */}
          <div className="space-y-6">
            {/* Moyens de contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Autres moyens de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-sm text-gray-600">support@serenibook.fr</p>
                    <p className="text-xs text-gray-500">Réponse sous 24h</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Téléphone</h4>
                    <p className="text-sm text-gray-600">01 23 45 67 89</p>
                    <p className="text-xs text-gray-500">Lun-Ven 9h-18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Adresse</h4>
                    <p className="text-sm text-gray-600">
                      123 Avenue du Bien-être<br/>
                      75001 Paris, France
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ rapide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Questions fréquentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Comment commencer ?</h4>
                  <p className="text-xs text-gray-600">
                    Inscrivez-vous gratuitement et profitez de 14 jours d'essai complet.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Problème technique ?</h4>
                  <p className="text-xs text-gray-600">
                    Utilisez le formulaire en précisant votre problème pour un support rapide.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Tarifs et facturation ?</h4>
                  <p className="text-xs text-gray-600">
                    Consultez notre page tarifs ou contactez-nous pour un devis personnalisé.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Temps de réponse */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-800 mb-3">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Engagement de service</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Support urgent : 2h</li>
                  <li>• Questions techniques : 24h</li>
                  <li>• Demandes commerciales : 4h</li>
                  <li>• Support disponible 7j/7</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section entreprise */}
        <div className="mt-16 bg-primary/5 rounded-2xl p-8 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Vous représentez une entreprise ?</h2>
          <p className="text-gray-600 mb-6">
            Nous proposons des solutions sur mesure pour les centres de bien-être, 
            spas, cliniques et réseaux de professionnels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Users className="mr-2 h-4 w-4" />
              Solutions entreprise
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              Demander une démo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}