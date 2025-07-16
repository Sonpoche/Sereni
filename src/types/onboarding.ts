// src/types/onboarding.ts
import { UserRole } from "@prisma/client"

// Interface pour un service individuel
export interface ServiceData {
  name: string;
  description: string;
  duration: number;
  price: number;
  color: string;
  location?: string;
}

// Interface pour les données d'onboarding complètes
export interface OnboardingData {
  userId: string;
  role: UserRole;
  personalInfo: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  activity?: {
    type: string;
    otherTypeDetails?: string;
    experience: number;
  };
  bio?: {
    bio: string;
    approach: string;
  };
  services?: {
    services: ServiceData[];
  };
  preferences: {
    notifications: {
      email: {
        bookingConfirmation: boolean;
        bookingReminder: boolean;
        bookingCancellation: boolean;
        newsletter: boolean;
        promotions: boolean;
      };
      sms: {
        bookingConfirmation: boolean;
        bookingReminder: boolean;
        bookingCancellation: boolean;
      };
    };
    privacy?: {
      showProfile: boolean;
      showAvailability: boolean;
    };
  };
}