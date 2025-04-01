// src/components/register/steps/account-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConseilBox } from "@/components/ui/conseil-box"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { 
  Loader2, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  Lightbulb
} from "lucide-react"

// Schéma de validation
const accountSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&+])[A-Za-z\d@$!%*#?&+]{8,}$/,
      "Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial (@$!%*#?&+)"
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  onSubmit: (data: AccountFormData) => void;
  isLoading?: boolean;
}

export default function AccountForm({ onSubmit, isLoading = false }: AccountFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  // Vérification de l'existence de l'email
  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch("/api/register/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.exists) {
        form.setError("email", {
          type: "manual",
          message: "Un compte existe déjà avec cet email"
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email:", error);
      return false;
    }
  };

  const handleSubmit = async (data: AccountFormData) => {
    try {
      setError(null);
      
      // Vérifier si l'email existe déjà
      const emailExists = await checkEmailExists(data.email);
      if (emailExists) return;

      // Si tout est ok, soumettre les données
      onSubmit(data);
    } catch (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Créer votre compte
        </h1>
        <p className="text-gray-500 text-base">
          Commencez votre inscription sur SereniBook
        </p>
      </div>

      <ConseilBox 
        icon={<Lightbulb className="h-5 w-5 text-lavender" />}
        className="mb-8"
      >
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Mail className="h-4 w-4" />}>
                    Email
                  </FormLabel>
                  <FormDescription>
                    Votre email servira d'identifiant de connexion
                  </FormDescription>
                  <FormControl>
                    <Input 
                      placeholder="vous@example.com"
                      type="email"
                      className="h-11 bg-white"
                      autoComplete="email"
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="bg-primary/5 rounded-lg p-4">
                  <FormLabel required icon={<Lock className="h-4 w-4" />}>
                    Mot de passe
                  </FormLabel>
                  <FormDescription>
                    8 caractères minimum avec lettres, chiffres et caractères spéciaux
                  </FormDescription>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-white pr-10"
                        autoComplete="new-password"
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
                        autoComplete="new-password"
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
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Continuer"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}