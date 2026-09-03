import "server-only"

import { cache } from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"

import { createServiceRoleClient } from "@/utils/supabase/admin"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import { therapistDisplayName } from "@/lib/patients/display"

let sharedServiceClient: SupabaseClient | null = null

function serviceClientOrNull(): SupabaseClient | null {
  if (sharedServiceClient) {
    return sharedServiceClient
  }
  try {
    sharedServiceClient = createServiceRoleClient()
  } catch {
    sharedServiceClient = null
  }
  return sharedServiceClient
}

export async function privilegedClinicClient(userClient: SupabaseClient): Promise<SupabaseClient> {
  return serviceClientOrNull() ?? userClient
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

async function loadClinicMembers(
  client: SupabaseClient,
  userId: string,
): Promise<ClinicTherapistOption[]> {
  const { data: me } = await client
    .from("clinic_profiles")
    .select("clinic_name")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  const clinicName = String(me?.clinic_name ?? "").trim()
  if (!clinicName) {
    return []
  }

  const { data } = await client
    .from("clinic_profiles")
    .select("user_id, therapist_name, clinic_name")
    .ilike("clinic_name", clinicName)
    .order("therapist_name", { ascending: true })

  const wanted = normalizeClinicName(clinicName)
  return (data ?? [])
    .filter((row) => typeof row.user_id === "string" && normalizeClinicName(row.clinic_name) === wanted)
    .map((row) => ({
      user_id: String(row.user_id),
      therapist_name:
        typeof row.therapist_name === "string" && row.therapist_name.trim().length > 0
          ? row.therapist_name.trim()
          : "Terapeut",
    }))
}

/** Deduplică interogările de echipă în cadrul aceluiași request. */
const cachedClinicMembers = cache(async (userId: string): Promise<ClinicTherapistOption[]> => {
  const client = serviceClientOrNull()
  if (!client) {
    return []
  }
  return loadClinicMembers(client, userId)
})

export async function listClinicMemberProfiles(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClinicTherapistOption[]> {
  if (serviceClientOrNull()) {
    return cachedClinicMembers(userId)
  }
  return loadClinicMembers(supabase, userId)
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
