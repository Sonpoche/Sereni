// src/lib/fonts.ts
import { Quicksand, Playfair_Display } from 'next/font/google'

export const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
})

export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
})