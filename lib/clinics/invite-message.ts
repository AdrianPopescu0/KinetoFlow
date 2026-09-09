export function therapistInviteMessage(input: {
  therapistName: string
  clinicName: string
  inviteLink: string
  accessCode: string
}): string {
  const firstName = input.therapistName.trim().split(/\s+/)[0] || input.therapistName
  return [
    `Salut ${firstName}! Te-am adăugat în echipa clinicii ${input.clinicName} pe KinetoFlow.`,
    "Activează-ți accesul (fără email) și setează-ți parola de pe acest link unic:",
    `👉 ${input.inviteLink}`,
    "",
    `(Codul tău de acces este ${input.accessCode}).`,
  ].join("\n")
}
