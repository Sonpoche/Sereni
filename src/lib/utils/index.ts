// src/lib/utils/index.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number
): string[] {
  const slots: string[] = []
  let current = new Date(`1970-01-01T${startTime}`)
  const end = new Date(`1970-01-01T${endTime}`)

  while (current < end) {
    slots.push(current.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }))
    current = new Date(current.getTime() + duration * 60000)
  }

  return slots
}

export function formatServicePrice(price: any): string {
  if (typeof price === 'number') {
    return formatPrice(price);
  }
  
  if (typeof price === 'string') {
    // Essaie de convertir en nombre
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      return formatPrice(numPrice);
    }
    return price + ' €';
  }
  
  // Pour les autres types (comme Decimal de Prisma)
  if (price && typeof price.toString === 'function') {
    try {
      const numPrice = parseFloat(price.toString());
      if (!isNaN(numPrice)) {
        return formatPrice(numPrice);
      }
      return price.toString() + ' €';
    } catch (e) {
      return price.toString() + ' €';
    }
  }
  
  return '0,00 €';
}