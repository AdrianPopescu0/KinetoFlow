export const PENDING_EMAIL_OTP_KEY = "kf_pending_email_otp"

export type PendingEmailOtp = {
  email: string
  password: string
  purpose: "login" | "register"
  legalAccept?: boolean
  devCode?: string
}

function isPurpose(value: unknown): value is PendingEmailOtp["purpose"] {
  return value === "login" || value === "register"
}

export function writePendingEmailOtp(value: PendingEmailOtp) {
  if (typeof window === "undefined") {
    return
  }
  window.sessionStorage.setItem(PENDING_EMAIL_OTP_KEY, JSON.stringify(value))
}

export function readPendingEmailOtp(expectedEmail?: string): PendingEmailOtp | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const raw = window.sessionStorage.getItem(PENDING_EMAIL_OTP_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<PendingEmailOtp>
    if (
      typeof parsed.email !== "string" ||
      typeof parsed.password !== "string" ||
      !isPurpose(parsed.purpose) ||
      parsed.password.length === 0
    ) {
      return null
    }
    const email = parsed.email.trim().toLowerCase()
    if (expectedEmail && email !== expectedEmail.trim().toLowerCase()) {
      return null
    }
    return {
      email,
      password: parsed.password,
      purpose: parsed.purpose,
      legalAccept: parsed.legalAccept === true,
      devCode: typeof parsed.devCode === "string" ? parsed.devCode : undefined,
    }
  } catch {
    return null
  }
}

export function clearPendingEmailOtp() {
  if (typeof window === "undefined") {
    return
  }
  window.sessionStorage.removeItem(PENDING_EMAIL_OTP_KEY)
}
