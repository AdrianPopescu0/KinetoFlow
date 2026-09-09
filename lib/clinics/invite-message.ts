export function therapistInviteMessage(input: {
  therapistName: string
  clinicName: string
  inviteLink: string
}): string {
  const firstName = input.therapistName.trim().split(/\s+/)[0] || input.therapistName
  return [
    `Salut ${firstName}! Clinica ${input.clinicName} te-a invitat în echipa KinetoFlow.`,
    "Deschide linkul unic, introdu emailul tău personal și setează-ți parola. Contul ți-l creezi tu, fără ca administratorul să-ți facă unul dinainte:",
    `👉 ${input.inviteLink}`,
  ].join("\n")
}
