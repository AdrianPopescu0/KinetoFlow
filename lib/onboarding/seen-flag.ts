const listeners = new Set<() => void>()
const cache = new Map<string, boolean>()

export function therapistOnboardingKey(userId: string): string {
  return `kinetoflow_onboarding_completed_${userId}`
}

export function patientOnboardingKey(patientKey: string): string {
  return `kinetoflow_patient_onboarded_${patientKey}`
}

export function subscribeOnboardingFlag(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

/** Pe server presupunem „deja văzut”, ca modalul să nu apară în HTML-ul randat. */
export function onboardingSeenServerSnapshot(): boolean {
  return true
}

export function readOnboardingSeen(key: string): boolean {
  if (typeof window === "undefined") {
    return true
  }
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }
  let seen = false
  try {
    seen = window.localStorage.getItem(key) === "true"
  } catch {
    seen = true
  }
  cache.set(key, seen)
  return seen
}

export function markOnboardingSeen(key: string): void {
  cache.set(key, true)
  try {
    window.localStorage.setItem(key, "true")
  } catch {
    // modul privat / storage blocat: turul se închide oricum pentru sesiunea curentă
  }
  listeners.forEach((listener) => listener())
}
