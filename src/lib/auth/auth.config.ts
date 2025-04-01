// src/lib/auth/auth.config.ts
import NextAuth from "next-auth"
import type { NextAuthConfig, DefaultSession } from "next-auth"
import type { User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "@/lib/prisma/client"
import { UserRole, Prisma } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      hasProfile: boolean;
      emailVerified: Date | null;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    hasProfile: boolean;
    emailVerified: Date | null;
  }
}

type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  hasProfile: boolean;
  emailVerified: Date | null;
};

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
        },
        password: { 
          label: "Password", 
          type: "password",
        }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('🔴 [Auth] Credentials manquantes')
            return null
          }

          const emailString = credentials.email.toString()
          console.log('🟦 [Auth] Recherche de l\'utilisateur:', emailString)
          
          const user = await prisma.user.findFirst({
            where: { 
              email: emailString
            },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              hasProfile: true,
              emailVerified: true,
              professionalProfile: { select: { id: true } },
              clientProfile: { select: { id: true } }
            }
          })

          if (!user || !user.email || !user.password) {
            console.log('🔴 [Auth] Utilisateur non trouvé')
            return null
          }

          console.log('🟦 [Auth] Utilisateur trouvé:', {
            id: user.id,
            role: user.role,
            hasProfile: user.hasProfile,
            emailVerified: user.emailVerified
          })

          const isValidPassword = await compare(
            credentials.password.toString(),
            user.password
          )

          if (!isValidPassword) {
            console.log('🔴 [Auth] Mot de passe invalide')
            return null
          }

          const authUser: AuthUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasProfile: user.hasProfile,
            emailVerified: user.emailVerified
          }

          return authUser
        } catch (error) {
          console.error('🔴 [Auth] Erreur:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const requestId = crypto.randomUUID().slice(0, 8);
      console.log(`🟦 [Auth:${requestId}] JWT Callback - Token Initial:`, { 
        id: token.id,
        role: token.role,
        hasProfile: token.hasProfile,
        emailVerified: token.emailVerified ? "Vérifié" : "Non vérifié"
      })
      
      if (user) {
        // Cast user as AuthUser since we know the structure from our authorize callback
        const authUser = user as unknown as AuthUser
        token.id = authUser.id
        token.role = authUser.role
        token.hasProfile = authUser.hasProfile
        token.emailVerified = authUser.emailVerified
        
        console.log(`🟦 [Auth:${requestId}] JWT mis à jour avec les données utilisateur`)
      }
      
      // Si nous avons un ID utilisateur, vérifions l'état actuel de l'email
      if (token.id && !token.emailVerified) {
        try {
          // Utiliser fetch directement plutôt que prisma pour éviter les problèmes d'Edge Runtime
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${token.id}?check=emailVerified`, {
            headers: {
              'Cache-Control': 'no-store',
              'Pragma': 'no-cache'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.emailVerified) {
              console.log(`🟦 [Auth:${requestId}] Mise à jour de emailVerified dans le token d'après l'API`)
              token.emailVerified = new Date()
            }
          }
        } catch (error) {
          console.log(`🔴 [Auth:${requestId}] Erreur lors de la vérification de l'email:`, error)
        }
      }
    
      console.log(`🟦 [Auth:${requestId}] JWT Callback - Fin`)
      return token
    },
    async session({ session, token }) {
      const requestId = crypto.randomUUID().slice(0, 8);
      console.log(`🟦 [Auth:${requestId}] Session Callback - Début`)

      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.hasProfile = token.hasProfile
        session.user.emailVerified = token.emailVerified
        
        console.log(`🟦 [Auth:${requestId}] Session mise à jour avec les données du token`)
      }

      console.log(`🟦 [Auth:${requestId}] Session Callback - Fin`)
      return session
    }
  },
  pages: {
    signIn: "/connexion",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)