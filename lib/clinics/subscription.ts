import type { SupabaseClient } from "@supabase/supabase-js"

export type ClinicSubscription = {
  startsAt: string | null
  endsAt: string | null
}

export const ARCHIVE_LOCKED_MESSAGE =
  "Arhiva clinicii este blocată temporar până la reînnoirea abonamentului. Datele rămân păstrate, dar nu pot fi consultate cât timp abonamentul este expirat."

function parseBound(value: string | null | undefined): number | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function isClinicSubscriptionActive(
  startsAt: string | null,
  endsAt: string | null,
  now: Date = new Date(),
): boolean {
  const start = parseBound(startsAt)
  const end = parseBound(endsAt)
  const t = now.getTime()

  if (start === null && end === null) {
    return true
  }
  if (start === null && end !== null) {
    return t <= end
  }
  if (start !== null && end === null) {
    return t >= start
  }
  if (start === null || end === null) {
    return true
  }
  return start <= t && t <= end
}

function readSubscriptionDates(row: Record<string, unknown> | null | undefined): ClinicSubscription {
  return {
    startsAt: typeof row?.subscription_starts_at === "string" ? row.subscription_starts_at : null,
    endsAt: typeof row?.subscription_ends_at === "string" ? row.subscription_ends_at : null,
  }
}

function isMissingSubscriptionColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST204" ||
    message.includes("subscription_starts_at") ||
    message.includes("subscription_ends_at")
  )
}

export async function fetchClinicSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClinicSubscription> {
  const { clinicNameForUser, privilegedClinicClient } = await import("@/lib/clinics/members")
  const client = await privilegedClinicClient(supabase)

  const own = await client
    .from("clinic_profiles")
    .select("subscription_starts_at, subscription_ends_at, role, clinic_name")
    .eq("user_id", userId)
    .maybeSingle()

  if (own.error) {
    if (isMissingSubscriptionColumn(own.error)) {
      return { startsAt: null, endsAt: null }
    }
    return { startsAt: null, endsAt: null }
  }

  const ownDates = readSubscriptionDates(own.data as Record<string, unknown> | null)
  if (ownDates.startsAt || ownDates.endsAt) {
    return ownDates
  }

  const clinicName = await clinicNameForUser(supabase, userId)
  if (!clinicName) {
    return ownDates
  }

  const members = await client
    .from("clinic_profiles")
    .select("subscription_starts_at, subscription_ends_at, role")
    .ilike("clinic_name", clinicName)
    .limit(40)

  if (members.error) {
    return ownDates
  }

  const withDates = ((members.data ?? []) as Record<string, unknown>[])
    .map((row) => ({ role: row.role, dates: readSubscriptionDates(row) }))
    .filter((row) => row.dates.startsAt || row.dates.endsAt)

  const admin = withDates.find((row) => row.role === "admin")
  return admin?.dates ?? withDates[0]?.dates ?? ownDates
}
