import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"

export interface UserSession {
  name?: string | null
  email?: string | null
  role?: string | null
  hasProfile?: boolean
}

export const getServerSession = async (): Promise<UserSession | null> => {
  const cookieStore = await cookies()
  // Vérifier d'abord le cookie de dev, puis le cookie de prod
  const sessionToken = cookieStore.get("__Secure-next-auth.session-token") || 
                      cookieStore.get("next-auth.session-token")

  if (!sessionToken) {
    return null
  }

  try {
    const decoded = jwtDecode<UserSession>(sessionToken.value)
    return decoded
  } catch {
    return null
  }
}