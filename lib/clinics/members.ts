import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import { createServiceRoleClient } from "@/utils/supabase/admin"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import { therapistDisplayName } from "@/lib/patients/display"

export async function privilegedClinicClient(userClient: SupabaseClient): Promise<SupabaseClient> {
  try {
    return createServiceRoleClient()
  } catch {
    return userClient
  }
}

export async function clinicNameForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const client = await privilegedClinicClient(supabase)
  const { data: me } = await client
    .from("clinic_profiles")
    .select("clinic_name")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()
  return String(me?.clinic_name ?? "").trim()
}

/** Numele de cabinet e comparat fără diacritice de caz: „KinetoKlinik” = „KInetoKlinik”. */
function normalizeClinicName(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("ro-RO")
}

export async function listClinicMemberProfiles(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClinicTherapistOption[]> {
  const clinicName = await clinicNameForUser(supabase, userId)
  if (!clinicName) {
    return []
  }

  const client = await privilegedClinicClient(supabase)
  const { data } = await client
    .from("clinic_profiles")
    .select("user_id, therapist_name, clinic_name")
    .ilike("clinic_name", clinicName)
    .order("therapist_name", { ascending: true })

  const wanted = normalizeClinicName(clinicName)
  const members = (data ?? []).filter(
    (row) => typeof row.user_id === "string" && normalizeClinicName(row.clinic_name) === wanted,
  )

  return members.map((row) => ({
    user_id: String(row.user_id),
    therapist_name:
      typeof row.therapist_name === "string" && row.therapist_name.trim().length > 0
        ? row.therapist_name.trim()
        : "Terapeut",
  }))
}

export async function listClinicMemberUserIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const members = await listClinicMemberProfiles(supabase, userId)
  const ids = [...new Set(members.map((row) => row.user_id))]
  return ids.length > 0 ? ids : [userId]
}

export async function shareClinicName(
  supabase: SupabaseClient,
  leftUserId: string,
  rightUserId: string,
): Promise<boolean> {
  if (leftUserId === rightUserId) {
    return true
  }
  const members = await listClinicMemberUserIds(supabase, leftUserId)
  return members.includes(rightUserId)
}

export async function listClinicTherapistOptions(
  supabase: SupabaseClient,
  user: User,
): Promise<ClinicTherapistOption[]> {
  const members = await listClinicMemberProfiles(supabase, user.id)
  if (members.some((row) => row.user_id === user.id)) {
    return members
  }

  const selfName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim()
      : therapistDisplayName(user.email)

  return [{ user_id: user.id, therapist_name: selfName }, ...members]
}
