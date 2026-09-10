export function therapistInviteMessage(input: {
  therapistName: string
  clinicName: string
  inviteLink: string
}): string {
  const firstName = input.therapistName.trim().split(/\s+/)[0] || input.therapistName
  return [
    `Salut ${firstName}! Clinica ${input.clinicName} te-a invitat în echipa KinetoFlow.`,
    "Deschide linkul, alege o parolă și activează-ți contul. Emailul e deja pe invitație:",
    `👉 ${input.inviteLink}`,
  ].join("\n")
}
