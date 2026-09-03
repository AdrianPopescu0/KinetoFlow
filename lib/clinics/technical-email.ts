import { randomBytes } from "node:crypto"

const DIACRITICS: Record<string, string> = {
  ă: "a",
  â: "a",
  î: "i",
  ș: "s",
  ţ: "t",
  ț: "t",
  Ă: "a",
  Â: "a",
  Î: "i",
  Ș: "s",
  Ţ: "t",
  Ț: "t",
}

export function slugFromPersonName(name: string): string {
  const folded = name
    .split("")
    .map((char) => DIACRITICS[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 28)

  return folded.length > 0 ? folded : "therapist"
}

export function newTherapistTechnicalEmail(fullName: string): string {
  const slug = slugFromPersonName(fullName)
  const shortId = randomBytes(3).toString("hex")
  return `${slug}.${shortId}@kinetoflow.internal`
}

export function randomAccountPassword(): string {
  return randomBytes(32).toString("base64url")
}
