export const EARLY_ACCESS_CODE_LENGTH = 12
export const EARLY_ACCESS_COOKIE = "kf_early_access"
export const EARLY_ACCESS_TTL_DAYS = 90
export const EARLY_ACCESS_TTL_MS = EARLY_ACCESS_TTL_DAYS * 24 * 60 * 60 * 1000
export const DEFAULT_EARLY_ACCESS_CODE = "KINETO-EARLY"
/** Semnătură Edge-safe: nu depinde de SERVICE_ROLE_KEY, care lipsește adesea din middleware. */
export const EARLY_ACCESS_FALLBACK_PEPPER = "kinetoflow-early-access"
