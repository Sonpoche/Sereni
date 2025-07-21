// src/hooks/use-auth.ts
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
      console.log('🟦 [useAuth] Début de l\'inscription pour:', data.email)
      
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
        console.error('🔴 [useAuth] Erreur d\'inscription:', result)
        throw new Error(result.error || "Erreur lors de l'inscription")
      }

      console.log('🟦 [useAuth] Inscription réussie, connexion automatique...')

      // Connexion immédiate après l'enregistrement
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (loginResult?.error) {
        console.error('🔴 [useAuth] Erreur de connexion après inscription:', loginResult.error)
        throw new Error(loginResult.error)
      }

      console.log('🟦 [useAuth] Connexion réussie après inscription')
      return result
    } catch (error) {
      console.error("🔴 [useAuth] Erreur lors de l'inscription:", error)
      throw error
    }
  }

  const completeOnboarding = async (data: OnboardingData) => {
    try {
      console.log('🟦 [useAuth] Début de l\'onboarding pour userId:', data.userId)
      console.log('🟦 [useAuth] Données d\'onboarding:', {
        userId: data.userId,
        role: data.role,
        hasPersonalInfo: !!data.personalInfo,
        hasActivity: !!data.activity,
        hasBio: !!data.bio,
        hasServices: !!data.services?.services?.length,
        hasSchedule: !!data.schedule,
        hasPreferences: !!data.preferences
      })

      // ✅ CORRECTION : Validation côté client avant envoi
      if (!data.userId) {
        throw new Error("ID utilisateur manquant")
      }

      if (!data.role) {
        throw new Error("Rôle utilisateur manquant")
      }

      if (!data.preferences) {
        throw new Error("Préférences manquantes")
      }

      // ✅ CORRECTION : S'assurer que les données obligatoires sont présentes
      const sanitizedData: OnboardingData = {
        ...data,
        personalInfo: data.personalInfo || {},
        preferences: {
          notifications: {
            email: {
              bookingConfirmation: data.preferences.notifications?.email?.bookingConfirmation ?? true,
              bookingReminder: data.preferences.notifications?.email?.bookingReminder ?? true,
              bookingCancellation: data.preferences.notifications?.email?.bookingCancellation ?? true,
              newsletter: data.preferences.notifications?.email?.newsletter ?? false,
              promotions: data.preferences.notifications?.email?.promotions ?? false,
            },
            sms: {
              bookingConfirmation: data.preferences.notifications?.sms?.bookingConfirmation ?? false,
              bookingReminder: data.preferences.notifications?.sms?.bookingReminder ?? false,
              bookingCancellation: data.preferences.notifications?.sms?.bookingCancellation ?? false,
            }
          },
          privacy: data.preferences.privacy || {
            showProfile: true,
            showAvailability: true
          }
        }
      }

      console.log('🟦 [useAuth] Données sanitisées envoyées:', sanitizedData)

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      })

      console.log('🟦 [useAuth] Réponse reçue, status:', response.status)

      // ✅ CORRECTION : Gestion d'erreur améliorée
      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔴 [useAuth] Erreur de l\'API onboarding:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        // Afficher les détails d'erreur de validation si disponibles
        if (errorData.details && Array.isArray(errorData.details)) {
          console.error('🔴 [useAuth] Détails des erreurs de validation:')
          errorData.details.forEach((detail: any, index: number) => {
            console.error(`🔴 [useAuth] Erreur ${index + 1}:`, detail)
          })
        }
        
        // Montrer les données reçues par l'API si disponibles
        if (errorData.receivedData) {
          console.error('🔴 [useAuth] Données reçues par l\'API:', errorData.receivedData)
        }
        
        throw new Error(errorData.error || "Erreur lors de la création du profil")
      }

      const result = await response.json()
      console.log('🟦 [useAuth] Onboarding terminé avec succès:', result.success)
      
      return result // Retourne l'objet complet avec { success, data, redirect }
    } catch (error) {
      console.error("🔴 [useAuth] Erreur lors de l'onboarding:", error)
      
      // ✅ CORRECTION : Gestion d'erreur plus spécifique
      if (error instanceof Error) {
        // Réutiliser le message d'erreur existant s'il est informatif
        if (error.message !== "Données invalides") {
          throw error
        } else {
          // Améliorer le message d'erreur générique
          throw new Error("Les données du formulaire ne sont pas valides. Veuillez vérifier tous les champs obligatoires.")
        }
      }
      
      throw new Error("Une erreur inattendue s'est produite lors de la finalisation de votre profil")
    }
  }

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      console.log('🟦 [useAuth] Tentative de connexion pour:', email)
      
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        console.error('🔴 [useAuth] Erreur de connexion:', result.error)
        throw new Error(result.error)
      }

      console.log('🟦 [useAuth] Connexion réussie')
      return result
    } catch (error) {
      console.error("🔴 [useAuth] Erreur lors de la connexion:", error)
      throw error
    }
  }

  return {
    register,
    completeOnboarding,
    loginWithCredentials,
  }
}