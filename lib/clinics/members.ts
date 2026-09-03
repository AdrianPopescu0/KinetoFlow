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

export async function listClinicMemberUserIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const client = await privilegedClinicClient(supabase)
  const { data: me } = await client
    .from("clinic_profiles")
    .select("clinic_name")
    .eq("user_id", userId)
    .maybeSingle()

  const clinicName = String(me?.clinic_name ?? "").trim()
  if (!clinicName) {
    return [userId]
  }

  const { data: members } = await client
    .from("clinic_profiles")
    .select("user_id")
    .eq("clinic_name", clinicName)

  const ids = [
    ...new Set(
      (members ?? [])
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ]
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
  const selfName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim()
      : therapistDisplayName(user.email)

  const client = await privilegedClinicClient(supabase)
  const { data: me } = await client
    .from("clinic_profiles")
    .select("clinic_name, therapist_name")
    .eq("user_id", user.id)
    .maybeSingle()

  const clinicName = String(me?.clinic_name ?? "").trim()
  let rows: Array<{ user_id: unknown; therapist_name: unknown }> = []

  if (clinicName) {
    const { data } = await client
      .from("clinic_profiles")
      .select("user_id, therapist_name")
      .eq("clinic_name", clinicName)
    rows = data ?? []
  }

  const fromProfiles = rows
    .filter((row) => typeof row.user_id === "string")
    .map((row) => ({
      id: String(row.user_id),
      name:
        typeof row.therapist_name === "string" && row.therapist_name.trim().length > 0
          ? row.therapist_name.trim()
          : selfName,
    }))

  if (fromProfiles.some((row) => row.id === user.id)) {
    return fromProfiles
  }

  const ownName =
    typeof me?.therapist_name === "string" && me.therapist_name.trim().length > 0
      ? me.therapist_name.trim()
      : selfName
  return [{ id: user.id, name: ownName }, ...fromProfiles]
}
