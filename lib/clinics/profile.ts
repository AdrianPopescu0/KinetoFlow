import type { SupabaseClient } from "@supabase/supabase-js"

import type { ClinicProfile } from "@/lib/clinics/types"
import { formatSupabaseError } from "@/lib/supabase/format-error"

export async function fetchClinicProfile(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<{ profile: ClinicProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("clinic_profiles")
    .select("user_id, clinic_name, therapist_name, phone")
    .eq("user_id", therapistId)
    .maybeSingle()

  if (error) {
    return { profile: null, error: formatSupabaseError(error) }
  }

  if (!data) {
    return { profile: null, error: null }
  }

  return { profile: data as ClinicProfile, error: null }
}

export function clinicSetupIsComplete(result: { profile: ClinicProfile | null }): boolean {
  return Boolean(result.profile)
}

export async function therapistHasClinicProfile(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<boolean> {
  const result = await fetchClinicProfile(supabase, therapistId)
  return clinicSetupIsComplete(result)
}
