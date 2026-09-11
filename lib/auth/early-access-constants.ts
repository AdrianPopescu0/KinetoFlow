export const EARLY_ACCESS_CODE_LENGTH = 12
export const EARLY_ACCESS_COOKIE = "early_access_verified"
/** Nume vechi — nu se mai citește și nu se mai scrie. */
export const LEGACY_EARLY_ACCESS_COOKIE = "kf_early_access"
export const EARLY_ACCESS_TTL_DAYS = 90
export const EARLY_ACCESS_MAX_AGE_SECONDS = EARLY_ACCESS_TTL_DAYS * 24 * 60 * 60
export const EARLY_ACCESS_TTL_MS = EARLY_ACCESS_MAX_AGE_SECONDS * 1000
export const DEFAULT_EARLY_ACCESS_CODE = "KINETO-EARLY"
/** Semnătură identică pe Node și Edge — fără env vars care lipsesc din middleware. */
export const EARLY_ACCESS_FALLBACK_PEPPER = "kinetoflow-early-access"
