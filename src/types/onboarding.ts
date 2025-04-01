import { UserRole } from "@prisma/client"

export interface OnboardingData {
  userId: string;
  role: UserRole;
  personalInfo: {
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