/** Mesajul precompletat la adăugarea unui pacient (WhatsApp wa.me + SMS). */
export function patientInviteShareMessage(input: {
  fullName: string
  accessCode: string
  accessUrl: string
}): string {
  const name = input.fullName.trim() || "pacient"
  const code = input.accessCode.trim()
  const accessUrl = input.accessUrl.trim()
  return [
    `Bună, ${name}! Sunt kinetoterapeutul tău de la KinetoFlow. Ți-am pregătit planul tău personalizat de exerciții.`,
    `Accesează aplicația aici: ${accessUrl}`,
    "",
    `Codul tău unic de 8 cifre: ${code}`,
    "",
    "Introdu numărul tău de telefon și codul de mai sus pentru a intra în program.",
    "Te rog să faci check-in-ul de durere înainte să începi exercițiile. Spor la recuperare!",
  ].join("\n")
}
