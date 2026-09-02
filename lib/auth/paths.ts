export function safeAuthNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null
  }
  if (next === "/onboarding" || next === "/dashboard" || next.startsWith("/dashboard/")) {
    return next
  }
  return null
}
