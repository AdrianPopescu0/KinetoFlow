export type LandingStat = {
  value: number
  label: string
}

export const LANDING_STATS_EYEBROW = "Cifre cheie"
export const LANDING_STATS_TITLE = "Recuperarea, măsurată în cabinet"
export const LANDING_STATS_LEAD = "Le actualizăm pe măsură ce KinetoFlow crește alături de clinici și terapeuți."

/** Cifre publice pe landing — rămân 0 până le actualizăm pe măsură ce creștem. */
export const LANDING_STATS: LandingStat[] = [
  { value: 0, label: "pacienți monitorizați" },
  { value: 0, label: "clinici partenere" },
  { value: 0, label: "exerciții în bibliotecă" },
  { value: 0, label: "terapeuți activi" },
]
