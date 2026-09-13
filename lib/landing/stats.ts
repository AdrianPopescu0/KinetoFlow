export type LandingStat = {
  value: number
  label: string
}

/** Cifre publice pe landing — rămân 0 până le actualizăm pe măsură ce creștem. */
export const LANDING_STATS: LandingStat[] = [
  { value: 0, label: "pacienți monitorizați" },
  { value: 0, label: "clinici partenere" },
  { value: 0, label: "exerciții în bibliotecă" },
  { value: 0, label: "terapeuți activi" },
]
