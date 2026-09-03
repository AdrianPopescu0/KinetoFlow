export type ClinicRole = "admin" | "therapist"

export type ClinicProfile = {
  user_id: string
  clinic_id: string
  clinic_name: string
  therapist_name: string
  phone: string | null
  role: ClinicRole
}

export type ClinicTherapistOption = {
  id: string
  name: string
}

export function isClinicAdmin(profile: ClinicProfile | null | undefined): boolean {
  return profile?.role === "admin"
}
