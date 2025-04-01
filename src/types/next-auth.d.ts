// src/types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      hasProfile: boolean
      emailVerified: Date | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: UserRole
    hasProfile: boolean
    emailVerified: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    hasProfile: boolean
    emailVerified: Date | null
  }
}