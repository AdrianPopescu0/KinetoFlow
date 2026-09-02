export function generateAccessCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000))
}

export function isAccessCode(value: string): boolean {
  return /^\d{8}$/.test(value.trim())
}
