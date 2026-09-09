export type ClinicRole = "admin" | "therapist"

export type ClinicProfile = {
  id: string | null
  user_id: string
  clinic_name: string
  therapist_name: string
  phone: string | null
  role: ClinicRole
}

export type ClinicTherapistOption = {
  user_id: string
  therapist_name: string
}

export function isClinicAdmin(profile: ClinicProfile | null | undefined): boolean {
  return profile?.role === "admin"
}

/** Doar adminul poate scoate un terapeut; rândul de Admin nu se șterge. */
export function canRemoveClinicMember(input: {
  actorIsAdmin: boolean
  actorUserId: string
  memberRole: string | null | undefined
  memberUserId: string
}): boolean {
  if (!input.actorIsAdmin || !input.actorUserId || !input.memberUserId) {
    return false
  }
  if (input.memberUserId === input.actorUserId) {
    return false
  }
  return input.memberRole === "therapist"
}
