import type { Exercise, PainKind, PatientProgram, SleepQuality } from "@/lib/patients/types"

const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/

const SHOULDER_EXERCISES: Exercise[] = [
  {
    id: "pendul-codman",
    title: "Pendul Codman",
    category: "Mobilitate Umăr",
    youtubeId: "xpQM250vj3E",
    videoUrl: "https://www.youtube.com/watch?v=xpQM250vj3E",
    sets: 3,
    reps: 12,
    restSeconds: 30,
    instructions: "Lasă brațul să atârne relaxat. Mișcarea vine din corp, nu din umăr.",
  },
  {
    id: "alunecari-perete",
    title: "Alunecări pe perete",
    category: "Mobilitate Umăr",
    youtubeId: "KM36zdNUzZk",
    videoUrl: "https://www.youtube.com/watch?v=KM36zdNUzZk",
    sets: 3,
    reps: 10,
    restSeconds: 45,
    instructions: "Spatele lipește peretele. Ridică brațele lent, fără să ridici umerii.",
  },
  {
    id: "retractie-scapulara",
    title: "Retracție scapulară",
    category: "Stabilitate Umăr",
    youtubeId: "KWVchSPBbks",
    videoUrl: "https://www.youtube.com/watch?v=KWVchSPBbks",
    sets: 3,
    reps: 15,
    restSeconds: 30,
    instructions: "Apropie omoplații, ține 2 secunde, apoi relaxează.",
  },
]

const KNEE_EXERCISES: Exercise[] = [
  {
    id: "extensie-genunchi",
    title: "Extensie de genunchi din șezut",
    category: "Forță cvadriceps",
    youtubeId: "POpqNc7BgBU",
    videoUrl: "https://www.youtube.com/watch?v=POpqNc7BgBU",
    sets: 3,
    reps: 12,
    restSeconds: 40,
    instructions: "Întinde genunchiul controlat, fără să blochezi articulația.",
  },
  {
    id: "punte-glutei",
    title: "Punte de fesieri",
    category: "Stabilitate șold",
    youtubeId: "Rt_F1xjCUK4",
    videoUrl: "https://www.youtube.com/watch?v=Rt_F1xjCUK4",
    sets: 3,
    reps: 10,
    restSeconds: 45,
    instructions: "Ridică bazinul până formezi o linie dreaptă. Nu arcuia lombarii.",
  },
  {
    id: "mini-genuflexiuni",
    title: "Mini-genuflexiuni la perete",
    category: "Control genunchi",
    youtubeId: "KM36zdNUzZk",
    videoUrl: "https://www.youtube.com/watch?v=KM36zdNUzZk",
    sets: 3,
    reps: 8,
    restSeconds: 50,
    instructions: "Genunchii rămân pe linia vârfului picioarelor. Amplitude mică.",
  },
]

export function isValidPatientToken(token: string): boolean {
  return TOKEN_PATTERN.test(token)
}

export function getPatientProgram(token: string): PatientProgram | null {
  const normalized = token.toLowerCase()

  if (normalized.includes("mihai") || normalized.includes("genunchi")) {
    return {
      token,
      firstName: "Mihai",
      programLabel: "Recuperare genunchi — săptămâna 3 din 6",
      progressPercent: 48,
      exercises: KNEE_EXERCISES,
      therapistName: "Elena Ionescu",
      therapistPhone: null,
    }
  }

  if (normalized === "demo" || normalized === "ana") {
    return {
      token,
      firstName: "Ana",
      programLabel: "Recuperare umăr — săptămâna 4 din 6",
      progressPercent: 62,
      exercises: SHOULDER_EXERCISES,
      therapistName: "Elena Ionescu",
      therapistPhone: null,
    }
  }

  return null
}

export const SLEEP_OPTIONS: { value: SleepQuality; emoji: string; label: string }[] = [
  { value: "intrerupt", emoji: "😫", label: "Întrerupt" },
  { value: "moderat", emoji: "😐", label: "Moderat" },
  { value: "odihnitor", emoji: "😊", label: "Odihnitor" },
]

export const PAIN_KIND_OPTIONS: { value: PainKind; label: string }[] = [
  { value: "efort", label: "Doar la efort/mișcare" },
  { value: "continua", label: "Continuă / În repaus" },
  { value: "rigiditate", label: "Rigiditate dimineața" },
  { value: "fara", label: "Fără durere" },
]

export function painIntensityCopy(pain: number): { label: string; tone: "green" | "orange" | "red" } {
  if (pain <= 3) {
    return { label: "Durere ușoară", tone: "green" }
  }
  if (pain <= 6) {
    return { label: "Durere moderată", tone: "orange" }
  }
  return { label: "Durere severă", tone: "red" }
}

export function todayInBucharest(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function formatRomanianDate(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatRest(seconds: number): string {
  return `${seconds}s pauză`
}
