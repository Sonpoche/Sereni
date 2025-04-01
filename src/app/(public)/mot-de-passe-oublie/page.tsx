// src/app/(public)/forgot-password/page.tsx
"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConseilBox } from "@/components/ui/conseil-box"

const formSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
})

type FormData = z.infer<typeof formSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/mot-de-passe-oublie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue")
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-medium text-gray-900">
            Email envoyé
          </h1>
          <p className="text-gray-500 text-base">
            Si un compte existe avec cet email, vous recevrez les instructions pour réinitialiser votre mot de passe.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setSuccess(false)
            form.reset()
          }}
        >
          Retour
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-medium text-gray-900">
          Mot de passe oublié
        </h1>
        <p className="text-gray-500 text-base">
          Entrez votre email pour réinitialiser votre mot de passe
        </p>
      </div>

      <ConseilBox className="mb-8">
        Nous vous enverrons un email avec les instructions pour réinitialiser votre mot de passe.
      </ConseilBox>

      <div className="bg-white border border-primary/20 rounded-xl p-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Mail className="h-4 w-4" />}>
                    Email
                  </FormLabel>
                  <FormDescription>
                    L'email associé à votre compte
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="email"
                      className="h-11 bg-white"
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? "Envoi en cours..." : "Envoyer les instructions"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/connexion" className="text-primary hover:underline">
                Retour à la connexion
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}