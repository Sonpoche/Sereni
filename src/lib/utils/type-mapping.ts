import { ProfessionalType as UIType } from "@/types/professional"
import { ProfessionalType as DBType } from "@prisma/client"

// Indiquer explicitement que nous retournons un type de Prisma
export const mapProfessionalTypeToDB = (type: string): DBType => {
  const mapping: Record<string, DBType> = {
    COACH_VIE: "LIFE_COACH",
    COACH_SPORTIF: "PERSONAL_COACH",
    PROF_YOGA: "YOGA_TEACHER",
    PROF_PILATES: "PILATES_INSTRUCTOR",
    THERAPEUTE: "THERAPIST",
    PRATICIEN_MASSAGE: "MASSAGE_THERAPIST",
    PROF_MEDITATION: "MEDITATION_TEACHER",
    NATUROPATHE: "OTHER",
    NUTRITIONNISTE: "OTHER",
    OSTEOPATHE: "OTHER",
    REFLEXOLOGUE: "OTHER",
    SOPHROLOGUE: "OTHER",
    AUTRE: "OTHER"
  }

  return mapping[type] || "OTHER"
}