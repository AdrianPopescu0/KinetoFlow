export const VAS_DESCRIPTIONS: Record<number, string> = {
  0: "Corpul este complet relaxat; nu simți absolut nicio jenă.",
  1: "O mică zgârietură sau o ciupitură ușoară; uiți complet de ea dacă ai treabă.",
  2: "O tăietură fină de hârtie pe deget; e acolo, dar îți vezi de zi fără probleme.",
  3: "O febră musculară obișnuită sau o lovitură ușoară la degetul mic; deranjează, dar mergi mai departe.",
  4: "O durere surdă de cap spre seară sau o măsea care pulsează ușor; simți nevoia de o pauză.",
  5: "O durere de spate care te obligă să te miști cu grijă și să schimbi des poziția pe scaun.",
  6: "O arsură pe mână când atingi tava din cuptor; nu te mai poți concentra pe nimic altceva.",
  7: "O entorsă urâtă de gleznă unde nu poți pune piciorul jos și nu poți dormi noaptea.",
  8: "O migrenă violentă cu greață și sensibilitate la lumină; abia poți vorbi cu cineva.",
  9: "Durerea aceea extremă care te face să transpiri rece și să nu-ți găsești locul nici măcar o secundă.",
  10: "Durerea maximă pe care ți-o poți imagina; corpul cedează și pur și simplu nu mai poți reacționa la nimic din jur.",
}

export const VAS_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export type VasScore = (typeof VAS_SCORES)[number]

export type VasPalette = {
  hex: string
  track: string
  selectedText: string
  idleBg: string
  idleText: string
  cardBg: string
  cardBorder: string
  glow: string
}

const PALETTE: Record<VasScore, VasPalette> = {
  0: {
    hex: "#16a34a",
    track: "#22c55e",
    selectedText: "#ffffff",
    idleBg: "#4ade80",
    idleText: "#14532d",
    cardBg: "#ecfdf5",
    cardBorder: "#86efac",
    glow: "rgba(22, 163, 74, 0.5)",
  },
  1: {
    hex: "#22c55e",
    track: "#4ade80",
    selectedText: "#14532d",
    idleBg: "#86efac",
    idleText: "#14532d",
    cardBg: "#f0fdf4",
    cardBorder: "#86efac",
    glow: "rgba(34, 197, 94, 0.45)",
  },
  2: {
    hex: "#65a30d",
    track: "#84cc16",
    selectedText: "#ffffff",
    idleBg: "#a3e635",
    idleText: "#365314",
    cardBg: "#f7fee7",
    cardBorder: "#bef264",
    glow: "rgba(132, 204, 22, 0.45)",
  },
  3: {
    hex: "#a3e635",
    track: "#bef264",
    selectedText: "#1a2e05",
    idleBg: "#d9f99d",
    idleText: "#3f6212",
    cardBg: "#f7fee7",
    cardBorder: "#bef264",
    glow: "rgba(163, 230, 53, 0.5)",
  },
  4: {
    hex: "#eab308",
    track: "#facc15",
    selectedText: "#422006",
    idleBg: "#fde047",
    idleText: "#713f12",
    cardBg: "#fefce8",
    cardBorder: "#facc15",
    glow: "rgba(234, 179, 8, 0.55)",
  },
  5: {
    hex: "#f59e0b",
    track: "#fbbf24",
    selectedText: "#ffffff",
    idleBg: "#fcd34d",
    idleText: "#78350f",
    cardBg: "#fffbeb",
    cardBorder: "#fbbf24",
    glow: "rgba(245, 158, 11, 0.5)",
  },
  6: {
    hex: "#f97316",
    track: "#fb923c",
    selectedText: "#ffffff",
    idleBg: "#fdba74",
    idleText: "#7c2d12",
    cardBg: "#fff7ed",
    cardBorder: "#fb923c",
    glow: "rgba(249, 115, 22, 0.5)",
  },
  7: {
    hex: "#ef4444",
    track: "#f87171",
    selectedText: "#ffffff",
    idleBg: "#fca5a5",
    idleText: "#7f1d1d",
    cardBg: "#fef2f2",
    cardBorder: "#f87171",
    glow: "rgba(239, 68, 68, 0.5)",
  },
  8: {
    hex: "#dc2626",
    track: "#ef4444",
    selectedText: "#ffffff",
    idleBg: "#f87171",
    idleText: "#ffffff",
    cardBg: "#fef2f2",
    cardBorder: "#f87171",
    glow: "rgba(220, 38, 38, 0.55)",
  },
  9: {
    hex: "#b91c1c",
    track: "#dc2626",
    selectedText: "#ffffff",
    idleBg: "#ef4444",
    idleText: "#ffffff",
    cardBg: "#fef2f2",
    cardBorder: "#dc2626",
    glow: "rgba(185, 28, 28, 0.55)",
  },
  10: {
    hex: "#7f1d1d",
    track: "#991b1b",
    selectedText: "#ffffff",
    idleBg: "#b91c1c",
    idleText: "#ffffff",
    cardBg: "#fef2f2",
    cardBorder: "#991b1b",
    glow: "rgba(127, 29, 29, 0.6)",
  },
}

export function clampVasScore(value: number): VasScore {
  const rounded = Math.round(value)
  if (rounded <= 0) {
    return 0
  }
  if (rounded >= 10) {
    return 10
  }
  return rounded as VasScore
}

export function vasPalette(value: number): VasPalette {
  return PALETTE[clampVasScore(value)]
}

export function vasBandLabel(value: number): string {
  const score = clampVasScore(value)
  if (score === 0) {
    return "Fără durere"
  }
  if (score <= 3) {
    return "Durere ușoară"
  }
  if (score <= 5) {
    return "Durere moderată"
  }
  if (score <= 7) {
    return "Durere intensă"
  }
  return "Durere severă"
}

export function vasDescription(value: number): string {
  return VAS_DESCRIPTIONS[clampVasScore(value)]
}
