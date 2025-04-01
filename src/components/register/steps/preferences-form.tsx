// src/components/register/steps/preferences-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormDescription 
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ConseilBox } from "@/components/ui/conseil-box"
import { 
  Loader2, 
  Bell, 
  MessageSquare,
  Settings,
  Eye,
  Calendar,
  Mail,
  MessageCircle,
  Megaphone,
  Lightbulb
} from "lucide-react"

const preferencesSchema = z.object({
  notifications: z.object({
    email: z.object({
      bookingConfirmation: z.boolean().default(true),
      bookingReminder: z.boolean().default(true),
      bookingCancellation: z.boolean().default(true),
      newsletter: z.boolean().default(false),
      promotions: z.boolean().default(false),
    }),
    sms: z.object({
      bookingConfirmation: z.boolean().default(false),
      bookingReminder: z.boolean().default(false),
      bookingCancellation: z.boolean().default(false),
    }),
  }),
  privacy: z.object({
    showProfile: z.boolean().default(true),
    showAvailability: z.boolean().default(true),
  }),
});

export type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  userType: UserRole;
  onSubmit: (data: PreferencesFormData) => void;
  onBack: () => void;
  initialData?: Partial<PreferencesFormData>;
  isLoading?: boolean;
}

export default function PreferencesForm({
  userType,
  onSubmit,
  onBack,
  initialData,
  isLoading = false
}: PreferencesFormProps) {
  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      notifications: {
        email: {
          bookingConfirmation: true,
          bookingReminder: true,
          bookingCancellation: true,
          newsletter: false,
          promotions: false,
        },
        sms: {
          bookingConfirmation: false,
          bookingReminder: false,
          bookingCancellation: false,
        },
      },
      privacy: {
        showProfile: true,
        showAvailability: true,
      },
      ...initialData
    }
  });

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Vos préférences
        </h1>
        <p className="text-gray-500 text-base">
          Personnalisez votre expérience
        </p>
      </div>

      <ConseilBox 
        icon={<Lightbulb className="h-5 w-5 text-lavender" />}
        className="mb-8"
      >
        Configurer vos notifications vous permet de ne rien manquer d'important
        tout en gardant le contrôle sur les communications que vous recevez.
      </ConseilBox>

      <div className="bg-white border border-primary/20 rounded-xl p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Notifications par email */}
            <div className="bg-primary/5 rounded-lg p-4 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-medium">Notifications par email</h3>
              </div>
              
              <FormField
                control={form.control}
                name="notifications.email.bookingConfirmation"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                    <div>
                      <FormLabel>Confirmation de réservation</FormLabel>
                      <FormDescription>
                        Email lors de la confirmation d'un rendez-vous
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications.email.bookingReminder"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                    <div>
                      <FormLabel>Rappel de rendez-vous</FormLabel>
                      <FormDescription>
                        Email de rappel 24h avant le rendez-vous
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications.email.newsletter"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                    <div>
                      <FormLabel>Newsletter</FormLabel>
                      <FormDescription>
                        Recevez nos actualités et conseils bien-être
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Notifications SMS */}
            <div className="bg-primary/5 rounded-lg p-4 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-medium">Notifications par SMS</h3>
              </div>

              <FormField
                control={form.control}
                name="notifications.sms.bookingConfirmation"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                    <div>
                      <FormLabel>Confirmation par SMS</FormLabel>
                      <FormDescription>
                        SMS lors de la confirmation d'un rendez-vous
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications.sms.bookingReminder"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                    <div>
                      <FormLabel>Rappel par SMS</FormLabel>
                      <FormDescription>
                        SMS de rappel 2h avant le rendez-vous
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {userType === UserRole.PROFESSIONAL && (
              <div className="bg-primary/5 rounded-lg p-4 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-medium">Paramètres du profil</h3>
                </div>

                <FormField
                  control={form.control}
                  name="privacy.showProfile"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                      <div>
                        <FormLabel>Profil public</FormLabel>
                        <FormDescription>
                          Votre profil est visible dans les recherches
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privacy.showAvailability"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 bg-white p-4 rounded-lg">
                      <div>
                        <FormLabel>Disponibilités publiques</FormLabel>
                        <FormDescription>
                          Vos créneaux disponibles sont visibles avant réservation
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  "Terminer l'inscription"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}