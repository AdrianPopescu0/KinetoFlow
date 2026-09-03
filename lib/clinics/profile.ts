import type { SupabaseClient, User } from "@supabase/supabase-js"

import type { ClinicProfile, ClinicTherapistOption } from "@/lib/clinics/types"
import { therapistDisplayName } from "@/lib/patients/display"
import { formatSupabaseError } from "@/lib/supabase/format-error"

export async function fetchClinicProfile(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<{ profile: ClinicProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("clinic_profiles")
    .select("id, user_id, clinic_name, therapist_name, role")
    .eq("user_id", therapistId)
    .maybeSingle()

  if (error) {
    const withPhone = await supabase
      .from("clinic_profiles")
      .select("id, user_id, clinic_name, therapist_name, phone, role")
      .eq("user_id", therapistId)
      .maybeSingle()
    if (!withPhone.error && withPhone.data) {
      return { profile: mapClinicProfile(withPhone.data as Record<string, unknown>, therapistId), error: null }
    }
    const fallback = await supabase
      .from("clinic_profiles")
      .select("user_id, clinic_name, therapist_name")
      .eq("user_id", therapistId)
      .maybeSingle()
    if (fallback.error) {
      return { profile: null, error: formatSupabaseError(error) }
    }
    if (!fallback.data) {
      return { profile: null, error: null }
    }
    return {
      profile: mapClinicProfile(fallback.data as Record<string, unknown>, therapistId),
      error: null,
    }
  }

  if (!data) {
    return { profile: null, error: null }
  }

  return { profile: mapClinicProfile(data as Record<string, unknown>, therapistId), error: null }
}

function mapClinicProfile(row: Record<string, unknown>, fallbackUserId: string): ClinicProfile {
  const role = row.role === "therapist" ? "therapist" : "admin"
  const userId = typeof row.user_id === "string" ? row.user_id : fallbackUserId
  return {
    id: typeof row.id === "string" ? row.id : null,
    user_id: userId,
    clinic_name: String(row.clinic_name ?? ""),
    therapist_name: String(row.therapist_name ?? ""),
    phone: typeof row.phone === "string" ? row.phone : null,
    role,
  }
}

export function clinicSetupIsComplete(result: { profile: ClinicProfile | null }): boolean {
  return Boolean(result.profile)
}

export function clinicReadyFromUser(user: User): boolean {
  const clinicName = user.user_metadata?.clinic_name
  return typeof clinicName === "string" && clinicName.trim().length > 0
}

/** Identificatorul de cabinet pentru pacienți (JWT / user.id), nu o coloană din clinic_profiles. */
export function clinicIdFromUser(user: User, profile?: ClinicProfile | null): string {
  const appClaim = user.app_metadata?.clinic_id
  const userClaim = user.user_metadata?.clinic_id
  if (typeof appClaim === "string" && appClaim.length > 0) {
    return appClaim
  }
  if (typeof userClaim === "string" && userClaim.length > 0) {
    return userClaim
  }
  return profile?.user_id ?? user.id
}

export async function listClinicTherapists(
  supabase: SupabaseClient,
  user: User,
): Promise<ClinicTherapistOption[]> {
  const selfName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim()
      : therapistDisplayName(user.email)

  const selfProfile = await fetchClinicProfile(supabase, user.id)
  const clinicName = selfProfile.profile?.clinic_name?.trim() ?? ""

  let query = supabase.from("clinic_profiles").select("user_id, therapist_name, clinic_name")
  if (clinicName) {
    query = query.eq("clinic_name", clinicName)
  }

  const { data } = await query
  const fromProfiles = (data ?? [])
    .filter((row) => typeof row.user_id === "string")
    .map((row) => ({
      user_id: String(row.user_id),
      therapist_name:
        typeof row.therapist_name === "string" && row.therapist_name.trim().length > 0
          ? row.therapist_name.trim()
          : selfName,
    }))

  if (fromProfiles.some((row) => row.user_id === user.id)) {
    return fromProfiles
  }

  return [{ user_id: user.id, therapist_name: selfName }, ...fromProfiles]
}

export async function therapistHasClinicProfile(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<boolean> {
  const result = await fetchClinicProfile(supabase, therapistId)
  return clinicSetupIsComplete(result)
}
