const STORAGE_KEY = "kinetoflow_patient_phone"
const listeners = new Set<() => void>()

let cached: string | null = null

export function subscribeRememberedPhone(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function rememberedPhoneServerSnapshot(): string {
  return ""
}

export function readRememberedPhone(): string {
  if (typeof window === "undefined") {
    return ""
  }
  if (cached !== null) {
    return cached
  }
  try {
    cached = window.localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    cached = ""
  }
  return cached
}

export function rememberPhone(phone: string): void {
  const value = phone.trim()
  if (!value) {
    return
  }
  cached = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // storage blocat: pacientul va introduce telefonul manual data viitoare
  }
  listeners.forEach((listener) => listener())
}
