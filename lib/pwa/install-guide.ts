export type InstallBrowser = "chrome" | "brave" | "samsung" | "edge" | "safari" | "firefox" | "other"
export type InstallPlatform = "android" | "ios" | "desktop"

export type InstallGuide = {
  browser: InstallBrowser
  browserLabel: string
  platform: InstallPlatform
  title: string
  intro: string
  steps: string[]
}

export type NavigatorHints = {
  userAgent: string
  vendor?: string
  isBrave?: boolean
  brands?: string[]
  maxTouchPoints?: number
}

export function detectPlatform(hints: NavigatorHints): InstallPlatform {
  const ua = hints.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "ios"
  }
  if (/Macintosh/i.test(ua) && (hints.maxTouchPoints ?? 0) > 1) {
    return "ios"
  }
  if (/Android/i.test(ua)) {
    return "android"
  }
  return "desktop"
}

export function detectInstallBrowser(hints: NavigatorHints): InstallBrowser {
  const ua = hints.userAgent
  const brands = (hints.brands ?? []).join(" ").toLowerCase()
  if (hints.isBrave || /\bbrave\b/i.test(brands)) {
    return "brave"
  }
  if (/SamsungBrowser/i.test(ua)) {
    return "samsung"
  }
  if (/Edg\//i.test(ua) || /\bedge\b/i.test(brands)) {
    return "edge"
  }
  if (/Firefox|FxiOS/i.test(ua)) {
    return "firefox"
  }
  if (/OPR\/|Opera/i.test(ua)) {
    return "other"
  }
  if (/Chrome|CriOS|Chromium/i.test(ua) || /\bchrome\b/i.test(brands) || /\bchromium\b/i.test(brands)) {
    return "chrome"
  }
  if (/Safari/i.test(ua) && /Apple/i.test(hints.vendor ?? "")) {
    return "safari"
  }
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Android/i.test(ua)) {
    return "safari"
  }
  return "other"
}

const BROWSER_LABEL: Record<InstallBrowser, string> = {
  chrome: "Chrome",
  brave: "Brave",
  samsung: "Samsung Internet",
  edge: "Microsoft Edge",
  safari: "Safari",
  firefox: "Firefox",
  other: "browserul tău",
}

function chromeSteps(platform: InstallPlatform): string[] {
  if (platform === "android") {
    return [
      "Apasă meniul cu trei puncte (⋮) din dreapta sus.",
      "Alege „Instalează aplicația” sau „Adaugă la ecranul de start”.",
      "Confirmă „Instalează”. Iconița KinetoFlow apare pe ecranul principal.",
    ]
  }
  if (platform === "ios") {
    return [
      "În Chrome pe iPhone, deschide meniul (⋮).",
      "Alege „Partajează” → „Pe ecranul de start”.",
      "Confirmă „Adaugă”. Aplicația apare lângă celelalte iconițe.",
    ]
  }
  return [
    "În dreapta barei de adrese, apasă iconița de instalare (ecran cu săgeată în jos).",
    "Dacă nu o vezi: meniul ⋮ din dreapta sus → „Instalează KinetoFlow…” sau „Install app”.",
    "Confirmă în fereastra care apare. Aplicația se deschide apoi din meniul Start, Dock sau lista de aplicații.",
  ]
}

function braveSteps(platform: InstallPlatform): string[] {
  if (platform === "android") {
    return [
      "Apasă meniul Brave (⋮) din dreapta jos sau dreapta sus.",
      "Alege „Adaugă la ecranul principal” sau „Instalează aplicația”.",
      "Confirmă. KinetoFlow apare ca aplicație pe telefon.",
    ]
  }
  if (platform === "ios") {
    return [
      "Deschide meniul Brave, apoi „Partajează”.",
      "Alege „Pe ecranul de start”.",
      "Confirmă „Adaugă”.",
    ]
  }
  return [
    "Deschide meniul Brave (☰) din dreapta sus.",
    "Alege „Instalează KinetoFlow” / „Add to dock” (Mac) sau „Install”.",
    "Dacă opțiunea lipsește, caută iconița de instalare în bara de adrese și confirmă.",
  ]
}

function samsungSteps(): string[] {
  return [
    "Apasă butonul de meniu (☰) din josul ecranului Samsung Internet.",
    "Alege „Adaugă pagină la” → „Ecranul de pornire”.",
    "Pe unele versiuni apare „Instalează aplicația” — apasă-l și confirmă.",
  ]
}

function edgeSteps(platform: InstallPlatform): string[] {
  if (platform === "android") {
    return [
      "Apasă meniul (⋯) din josul ecranului.",
      "Alege „Adaugă la telefon” sau „Instalează aplicația”.",
      "Confirmă instalarea.",
    ]
  }
  if (platform === "ios") {
    return [
      "Apasă Partajează, apoi „Pe ecranul de start”.",
      "Confirmă „Adaugă”.",
    ]
  }
  return [
    "În bara de adrese, apasă iconița de aplicație (pătrat cu semnul plus) din dreapta.",
    "Sau: meniul ⋯ → „Aplicații” → „Instalează acest site ca o aplicație”.",
    "Confirmă. KinetoFlow apare în meniul Start (Windows) sau Launchpad (Mac).",
  ]
}

function safariSteps(platform: InstallPlatform): string[] {
  if (platform === "ios") {
    return [
      "Apasă butonul de partajare (pătrat cu săgeată în sus).",
      "Derulează și alege „Pe ecranul de start”.",
      "Confirmă „Adaugă”.",
    ]
  }
  if (platform === "desktop") {
    return [
      "În Safari pe Mac: Fișier → „Adaugă la Dock” (macOS Sequoia+) sau Folosește Chrome / Brave pentru instalare ca aplicație.",
      "Confirmă numele „KinetoFlow”.",
    ]
  }
  return chromeSteps(platform)
}

function firefoxSteps(platform: InstallPlatform): string[] {
  if (platform === "android") {
    return [
      "Apasă meniul (⋮) din dreapta sus.",
      "Alege „Instalează”.",
      "Dacă nu apare, deschide KinetoFlow în Chrome, Brave sau Samsung Internet și instalează de acolo.",
    ]
  }
  return [
    "Firefox pe desktop nu instalează KinetoFlow ca aplicație nativă.",
    "Deschide același link în Chrome, Brave sau Edge, apoi apasă din nou „Instalează Aplicația KinetoFlow”.",
  ]
}

function otherSteps(): string[] {
  return [
    "Deschide meniul browserului (⋮ sau ☰).",
    "Caută „Instalează aplicația”, „Install app” sau „Adaugă la ecranul de start”.",
    "Dacă nu găsești opțiunea, deschide KinetoFlow în Chrome, Brave sau Samsung Internet.",
  ]
}

export function installGuideFor(hints: NavigatorHints): InstallGuide {
  const platform = detectPlatform(hints)
  const browser = detectInstallBrowser(hints)
  const browserLabel = BROWSER_LABEL[browser]
  const intro =
    "Adaugă KinetoFlow pe ecranul de start ca să deschizi programul dintr-o iconiță, fără bara de adrese."

  let steps: string[]
  if (browser === "chrome") {
    steps = chromeSteps(platform)
  } else if (browser === "brave") {
    steps = braveSteps(platform)
  } else if (browser === "samsung") {
    steps = samsungSteps()
  } else if (browser === "edge") {
    steps = edgeSteps(platform)
  } else if (browser === "safari") {
    steps = safariSteps(platform)
  } else if (browser === "firefox") {
    steps = firefoxSteps(platform)
  } else {
    steps = otherSteps()
  }

  return {
    browser,
    browserLabel,
    platform,
    title: `Pași în ${browserLabel}`,
    intro,
    steps,
  }
}

export function extraBrowserGuides(
  primary: InstallBrowser,
  platform: InstallPlatform,
): Array<{ label: string; steps: string[] }> {
  if (platform === "desktop") {
    const catalog = [
      { id: "chrome" as const, label: "Google Chrome", steps: chromeSteps("desktop") },
      { id: "brave" as const, label: "Brave", steps: braveSteps("desktop") },
    ]
    return catalog.filter((item) => item.id !== primary)
  }

  const catalog = [
    { id: "chrome" as const, label: "Google Chrome", steps: chromeSteps("android") },
    { id: "brave" as const, label: "Brave", steps: braveSteps("android") },
    { id: "samsung" as const, label: "Samsung Internet", steps: samsungSteps() },
  ]
  return catalog.filter((item) => item.id !== primary)
}

export function navigatorHintsFrom(nav: {
  userAgent?: string
  vendor?: string
  brave?: unknown
  userAgentData?: { brands?: Array<{ brand: string }> }
  maxTouchPoints?: number
}): NavigatorHints {
  return {
    userAgent: nav.userAgent ?? "",
    vendor: nav.vendor,
    isBrave: Boolean(nav.brave),
    brands: nav.userAgentData?.brands?.map((item) => item.brand) ?? [],
    maxTouchPoints: nav.maxTouchPoints,
  }
}
