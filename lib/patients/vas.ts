export const VAS_DESCRIPTIONS: Record<number, string> = {
  0: "Corpul este relaxat, nu simți nimic.",
  1: "Ca o etichetă de la tricou care te zgârie pe ceafă sau o înțepătură mică de țânțar. Uiți complet de ea dacă vorbești cu cineva.",
  2: "Ca o tăietură fină de hârtie pe deget sau o zgârietură mică. Știi că e acolo, dar îți vezi de treabă fără probleme.",
  3: "Ca febra musculară după o zi grea de sală sau o lovitură ușoară cu degetul mic de piciorul mesei. Deranjează, dar mergi înainte.",
  4: "Ca o durere sâcâitoare de dinte sau o durere de cap după o zi lungă la birou. Îți vine să iei o pastilă sau să faci o pauză scurtă.",
  5: "Ca atunci când te prinde spatele la volan sau când calci strâmb pe trotuar. Nu mai poți ignora locul; te foiești pe scaun sau șchiopătezi ușor.",
  6: "Ca o arsură pe mână când atingi tava încinsă sau o măsea umflată bine. Nu te mai poți concentra la lucru sau la un film; ești irascibil.",
  7: "Ca o entorsă urâtă de gleznă unde nu mai poți călca pe picior, sau un lumbago acut unde nu te mai poți apleca să-ți legi șireturile. Nu poți dormi noaptea de durere.",
  8: "Ca o coastă fisurată când tragi aer în piept sau o migrenă severă cu greață și lumină care te orbește. Abia poți lega două cuvinte la telefon.",
  9: "Ca o piatră la rinichi care pleacă sau o fractură deschisă de os. Nu poți sta locului, transpiri rece, plângi fără să vrei.",
  10: "Durerea la care cedează corpul și îți pierzi cunoștința; e nivelul de salvare și morfină.",
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
    hex: "#059669",
    track: "#10b981",
    selectedText: "#ffffff",
    idleBg: "#ecfdf5",
    idleText: "#047857",
    cardBg: "#ecfdf5",
    cardBorder: "#a7f3d0",
    glow: "rgba(16, 185, 129, 0.45)",
  },
  1: {
    hex: "#16a34a",
    track: "#22c55e",
    selectedText: "#ffffff",
    idleBg: "#f0fdf4",
    idleText: "#15803d",
    cardBg: "#f0fdf4",
    cardBorder: "#bbf7d0",
    glow: "rgba(34, 197, 94, 0.42)",
  },
  2: {
    hex: "#65a30d",
    track: "#84cc16",
    selectedText: "#ffffff",
    idleBg: "#f7fee7",
    idleText: "#4d7c0f",
    cardBg: "#f7fee7",
    cardBorder: "#d9f99d",
    glow: "rgba(132, 204, 22, 0.42)",
  },
  3: {
    hex: "#65a30d",
    track: "#a3e635",
    selectedText: "#ffffff",
    idleBg: "#f7fee7",
    idleText: "#4d7c0f",
    cardBg: "#f7fee7",
    cardBorder: "#d9f99d",
    glow: "rgba(163, 230, 53, 0.45)",
  },
  4: {
    hex: "#ca8a04",
    track: "#eab308",
    selectedText: "#422006",
    idleBg: "#fefce8",
    idleText: "#a16207",
    cardBg: "#fefce8",
    cardBorder: "#fde68a",
    glow: "rgba(234, 179, 8, 0.5)",
  },
  5: {
    hex: "#d97706",
    track: "#f59e0b",
    selectedText: "#ffffff",
    idleBg: "#fffbeb",
    idleText: "#b45309",
    cardBg: "#fffbeb",
    cardBorder: "#fcd34d",
    glow: "rgba(245, 158, 11, 0.5)",
  },
  6: {
    hex: "#ea580c",
    track: "#f97316",
    selectedText: "#ffffff",
    idleBg: "#fff7ed",
    idleText: "#c2410c",
    cardBg: "#fff7ed",
    cardBorder: "#fdba74",
    glow: "rgba(249, 115, 22, 0.5)",
  },
  7: {
    hex: "#c2410c",
    track: "#ea580c",
    selectedText: "#ffffff",
    idleBg: "#ffedd5",
    idleText: "#9a3412",
    cardBg: "#fff7ed",
    cardBorder: "#fb923c",
    glow: "rgba(234, 88, 12, 0.5)",
  },
  8: {
    hex: "#dc2626",
    track: "#ef4444",
    selectedText: "#ffffff",
    idleBg: "#fef2f2",
    idleText: "#b91c1c",
    cardBg: "#fef2f2",
    cardBorder: "#fecaca",
    glow: "rgba(239, 68, 68, 0.48)",
  },
  9: {
    hex: "#b91c1c",
    track: "#dc2626",
    selectedText: "#ffffff",
    idleBg: "#fee2e2",
    idleText: "#991b1b",
    cardBg: "#fef2f2",
    cardBorder: "#fca5a5",
    glow: "rgba(220, 38, 38, 0.5)",
  },
  10: {
    hex: "#991b1b",
    track: "#b91c1c",
    selectedText: "#ffffff",
    idleBg: "#fee2e2",
    idleText: "#7f1d1d",
    cardBg: "#fef2f2",
    cardBorder: "#f87171",
    glow: "rgba(185, 28, 28, 0.55)",
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
