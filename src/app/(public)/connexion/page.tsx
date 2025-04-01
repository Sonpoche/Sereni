// src/app/(public)/login/page.tsx
import { Metadata } from "next"
import LoginForm from "@/components/login/login-form"

export const metadata: Metadata = {
  title: "Connexion - SereniBook",
  description: "Connectez-vous à votre compte SereniBook",
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}