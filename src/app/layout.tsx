import type { Metadata } from "next"
import { Quicksand, Playfair_Display } from "next/font/google"
import { NextAuthProvider } from "@/components/providers/next-auth-provider"
import "./globals.css"

const quicksand = Quicksand({ 
  subsets: ["latin"],
  variable: "--font-quicksand",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
})

export const metadata: Metadata = {
  title: "SereniBook - Réservation bien-être",
  description: "Plateforme de réservation pour professionnels du bien-être",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${quicksand.variable} ${playfairDisplay.variable}`}>
      <body className={quicksand.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}