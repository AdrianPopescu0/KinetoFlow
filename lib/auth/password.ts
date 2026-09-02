export const REGISTER_PASSWORD_MIN_LENGTH = 8

export const REGISTER_PASSWORD_RULES = [
  {
    id: "length",
    label: "Minim 8 caractere",
    test: (password: string) => password.length >= REGISTER_PASSWORD_MIN_LENGTH,
  },
  {
    id: "upper",
    label: "O literă mare",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "digit",
    label: "O cifră",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Un caracter special",
    test: (password: string) => /[!@#$%^&*()_+]/.test(password),
  },
] as const

export const REGISTER_PASSWORD_HINT =
  "Minim 8 caractere, o majusculă, o cifră și un caracter special (!@#$%^&*()_+)."

export function evaluateRegisterPassword(password: string) {
  const checks = REGISTER_PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }))
  return {
    checks,
    isValid: checks.every((check) => check.met),
  }
}
