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