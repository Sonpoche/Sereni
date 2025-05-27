// src/types/professional.ts
export enum ProfessionalType {
  COACH_VIE = "COACH_VIE",
  COACH_SPORTIF = "COACH_SPORTIF",
  PROF_YOGA = "PROF_YOGA",
  PROF_PILATES = "PROF_PILATES",
  THERAPEUTE = "THERAPEUTE",
  PRATICIEN_MASSAGE = "PRATICIEN_MASSAGE",
  PROF_MEDITATION = "PROF_MEDITATION",
  NATUROPATHE = "NATUROPATHE",
  NUTRITIONNISTE = "NUTRITIONNISTE",
  OSTEOPATHE = "OSTEOPATHE",
  REFLEXOLOGUE = "REFLEXOLOGUE",
  SOPHROLOGUE = "SOPHROLOGUE",
  AUTRE = "AUTRE"
}

// Mapping entre les valeurs de l'API (backend) et notre énumération frontend
export const apiToProfessionalType: Record<string, ProfessionalType> = {
  "YOGA_TEACHER": ProfessionalType.PROF_YOGA,
  "PERSONAL_COACH": ProfessionalType.COACH_SPORTIF,
  "THERAPIST": ProfessionalType.THERAPEUTE,
  "MASSAGE_THERAPIST": ProfessionalType.PRATICIEN_MASSAGE,
  "PILATES_INSTRUCTOR": ProfessionalType.PROF_PILATES,
  "MEDITATION_TEACHER": ProfessionalType.PROF_MEDITATION,
  "LIFE_COACH": ProfessionalType.COACH_VIE,
  "OTHER": ProfessionalType.AUTRE
}

export const professionalTypeLabels: Record<ProfessionalType, string> = {
  [ProfessionalType.COACH_VIE]: "Coach de vie",
  [ProfessionalType.COACH_SPORTIF]: "Coach sportif",
  [ProfessionalType.PROF_YOGA]: "Professeur de yoga",
  [ProfessionalType.PROF_PILATES]: "Professeur de pilates",
  [ProfessionalType.THERAPEUTE]: "Thérapeute",
  [ProfessionalType.PRATICIEN_MASSAGE]: "Praticien en massage",
  [ProfessionalType.PROF_MEDITATION]: "Professeur de méditation",
  [ProfessionalType.NATUROPATHE]: "Naturopathe",
  [ProfessionalType.NUTRITIONNISTE]: "Nutritionniste",
  [ProfessionalType.OSTEOPATHE]: "Ostéopathe",
  [ProfessionalType.REFLEXOLOGUE]: "Réflexologue",
  [ProfessionalType.SOPHROLOGUE]: "Sophrologue",
  [ProfessionalType.AUTRE]: "Autre"
}

// Fonction pour obtenir le libellé à partir de la valeur API
export function getProfessionalTypeLabel(apiType: string | undefined): string {
  if (!apiType) return "Professionnel du bien-être";
  
  // Convertir la valeur API en type frontend
  const frontendType = apiToProfessionalType[apiType] || ProfessionalType.AUTRE;
  
  // Obtenir le libellé correspondant
  return professionalTypeLabels[frontendType];
}