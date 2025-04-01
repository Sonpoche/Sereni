// src/app/(public)/reinitialiser-mot-de-passe/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { Lock, Eye, EyeOff } from "lucide-react"
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
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&+])[A-Za-z\d@$!%*#?&+]{8,}$/,
      "Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial (@$!%*#?&+)"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof formSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenVerified, setTokenVerified] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    // Vérifier la validité du token
    const verifyToken = async () => {
      if (!token) {
        setError("Token manquant")
        return
      }

      try {
        const response = await fetch(`/api/auth/verifier-token?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Token invalide")
        }

        setTokenVerified(true)
      } catch (error) {
        setError("Ce lien de réinitialisation n'est plus valide")
        console.error(error)
      }
    }

    verifyToken()
  }, [token])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/reinitialiser-mot-de-passe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue")
      }

      // Rediriger vers la page de connexion
      router.push("/connexion?reset=success")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (!tokenVerified) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        {error ? (
          <>
            <h1 className="text-3xl font-medium text-gray-900 mb-4">
              Lien invalide
            </h1>
            <p className="text-gray-500 mb-8">
              {error}
            </p>
            <Link href="/mot-de-passe-oublie">
              <Button>
                Demander un nouveau lien
              </Button>
            </Link>
          </>
        ) : (
          <p>Vérification du lien...</p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-medium text-gray-900">
          Nouveau mot de passe
        </h1>
        <p className="text-gray-500 text-base">
          Choisissez un nouveau mot de passe pour votre compte
        </p>
      </div>

      <ConseilBox className="mb-8">
        Choisissez un mot de passe sécurisé contenant au moins une lettre majuscule,
        un chiffre et un caractère spécial pour protéger votre compte.
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
              name="password"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Lock className="h-4 w-4" />}>
                    Nouveau mot de passe
                  </FormLabel>
                  <FormDescription>
                    8 caractères minimum avec lettres, chiffres et caractères spéciaux
                  </FormDescription>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-white pr-10"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-0 top-0 h-11 w-11 px-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Lock className="h-4 w-4" />}>
                    Confirmer le mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        className="h-11 bg-white pr-10"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-0 top-0 h-11 w-11 px-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
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
              {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}