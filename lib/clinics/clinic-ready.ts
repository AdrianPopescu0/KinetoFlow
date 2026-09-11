import type { User } from "@supabase/supabase-js"

type AuthUserLike = Pick<User, "user_metadata" | "app_metadata">

function metadataRecord(
  value: User["user_metadata"] | User["app_metadata"] | null | undefined,
): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function metadataString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function clinicIdFromMetadata(user: AuthUserLike): string | null {
  return metadataString(metadataRecord(user.app_metadata), "clinic_id")
    ?? metadataString(metadataRecord(user.user_metadata), "clinic_id")
}

/** Terapeut invitat: rol, flag, token sau cine l-a chemat — independent de clinic_name din JWT. */
export function invitedTherapistFromUser(user: AuthUserLike): boolean {
  const userMeta = metadataRecord(user.user_metadata)
  const appMeta = metadataRecord(user.app_metadata)
  if (userMeta.role === "therapist" || appMeta.role === "therapist") {
    return true
  }
  if (userMeta.invited === true || userMeta.invited === "true") {
    return true
  }
  if (metadataString(userMeta, "invited_by")) {
    return true
  }
  if (metadataString(userMeta, "invite_token") || metadataString(appMeta, "invite_token")) {
    return true
  }
  return false
}

/**
 * Clinica e gata dacă JWT-ul are numele cabinetului sau clinic_id
 * (cont existent asociat, inclusiv sesiuni vechi fără clinic_name).
 */
export function clinicReadyFromUser(user: AuthUserLike): boolean {
  const userMeta = metadataRecord(user.user_metadata)
  const appMeta = metadataRecord(user.app_metadata)
  if (metadataString(userMeta, "clinic_name") || metadataString(appMeta, "clinic_name")) {
    return true
  }
  return Boolean(clinicIdFromMetadata(user))
}
