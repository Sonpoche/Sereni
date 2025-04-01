// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth/auth.config"

export const { GET, POST } = handlers