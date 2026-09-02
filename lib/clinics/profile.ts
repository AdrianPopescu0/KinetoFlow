import type { SupabaseClient } from "@supabase/supabase-js"

import type { ClinicProfile } from "@/lib/clinics/types"

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? ""
  const message = (error.message ?? "").toLowerCase()
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (message.includes("clinic_profiles") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  )
}

export async function fetchClinicProfile(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<{ profile: ClinicProfile | null; tableMissing: boolean }> {
  const { data, error } = await supabase
    .from("clinic_profiles")
    .select("id, clinic_name, therapist_full_name, contact_phone")
    .eq("id", therapistId)
    .maybeSingle()

  if (error) {
    return { profile: null, tableMissing: isMissingTableError(error) }
  }

  if (!data) {
    return { profile: null, tableMissing: false }
  }

  return { profile: data as ClinicProfile, tableMissing: false }
}

export function clinicSetupIsComplete(result: {
  profile: ClinicProfile | null
  tableMissing: boolean
}): boolean {
  return Boolean(result.profile)
}

export async function therapistHasClinicProfile(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<boolean> {
  const result = await fetchClinicProfile(supabase, therapistId)
  return clinicSetupIsComplete(result)
}
