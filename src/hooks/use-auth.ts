import { signIn } from "next-auth/react"
import { UserRole } from "@prisma/client"
import { OnboardingData } from "@/types/onboarding"

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export function useAuth() {
  const register = async (data: RegisterData) => {
    try {
      // Enregistrement
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'inscription")
      }

      // Connexion immédiate après l'enregistrement
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (loginResult?.error) {
        throw new Error(loginResult.error)
      }

      return result
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      throw error
    }
  }

  const completeOnboarding = async (data: OnboardingData) => {
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la création du profil")
      }

      const result = await response.json()
      return result // Retourne l'objet complet avec { success, data, redirect }
    } catch (error) {
      console.error("Erreur lors de l'onboarding:", error)
      throw error
    }
  }

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      return result
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      throw error
    }
  }

  return {
    register,
    completeOnboarding,
    loginWithCredentials,
  }
}