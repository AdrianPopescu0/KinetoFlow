export function patientAccessUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/patient/${token}`
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return `${siteUrl.replace(/\/$/, "")}/patient/${token}`
}

export function vasTone(score: number | null): "green" | "orange" | "red" | "muted" {
  if (score === null) {
    return "muted"
  }
  if (score <= 3) {
    return "green"
  }
  if (score <= 6) {
    return "orange"
  }
  return "red"
}

export function vasBadgeClass(score: number | null): string {
  const tone = vasTone(score)
  if (tone === "green") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200"
  }
  if (tone === "orange") {
    return "bg-amber-50 text-amber-800 ring-amber-200"
  }
  if (tone === "red") {
    return "bg-red-50 text-red-800 ring-red-200"
  }
  return "bg-slate-100 text-slate-600 ring-slate-200"
}

export function sleepLabel(value: string | null): string {
  switch (value) {
    case "odihnitor":
    case "foarte-bun":
      return "Odihnitor"
    case "moderat":
    case "mediu":
      return "Moderat"
    case "intrerupt":
    case "slab":
      return "Întrerupt"
    default:
      return value || "—"
  }
}

export function therapistDisplayName(email: string | undefined, metadataName?: string): string {
  if (metadataName && metadataName.trim().length > 0) {
    return metadataName.trim()
  }
  if (!email) {
    return "Terapeut"
  }
  const local = email.split("@")[0] ?? email
  return local.replace(/[._-]+/g, " ")
}

export function startOfTodayIso(): string {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  return `${stamp}T00:00:00.000+03:00`
}
