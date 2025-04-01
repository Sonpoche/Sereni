"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConseilBox } from "@/components/ui/conseil-box"
import { 
  Loader2, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Lightbulb
} from "lucide-react"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis"),
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/tableau-de-bord"

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginData) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (result?.error) {
        setError("Email ou mot de passe incorrect")
        return
      }

      router.push(callbackUrl)
    } catch (error) {
      setError("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* En-tête */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-title font-medium text-gray-900">
          Bienvenue sur SereniBook
        </h1>
        <p className="text-gray-500 text-base">
          Connectez-vous pour accéder à votre espace
        </p>
      </div>

      <ConseilBox 
        icon={<Lightbulb className="h-5 w-5 text-lavender" />}
        className="mb-8"
      >
        L'espace qui vous permet de gérer vos réservations et votre activité en toute sérénité.
      </ConseilBox>

      {/* Conteneur principal avec fond et bordure */}
      <div className="bg-white border border-primary/20 rounded-xl p-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Mail className="h-4 w-4" />}>
                    Email
                  </FormLabel>
                  <FormDescription>
                    Votre email sert d'identifiant de connexion
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

            {/* Mot de passe */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Lock className="h-4 w-4" />}>
                    Mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-white pr-10"
                        autoComplete="current-password"
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

            {/* Mot de passe oublié */}
            <div className="text-sm text-right">
              <Link 
                href="/mot-de-passe-oublie" 
                className="text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton de connexion */}
            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Lien d'inscription */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            Pas encore de compte ?{" "}
          </span>
          <Link 
            href="/inscription" 
            className="text-primary hover:underline font-medium"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}