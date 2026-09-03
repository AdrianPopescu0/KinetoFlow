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
