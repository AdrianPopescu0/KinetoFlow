"use server"

import { revalidatePath } from "next/cache"

import { getCachedUser } from "@/lib/auth/session"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { newTherapistTechnicalEmail, randomAccountPassword } from "@/lib/clinics/technical-email"
import { isClinicAdmin } from "@/lib/clinics/types"
import { ForbiddenError } from "@/lib/http/forbidden"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { patientWhatsAppHref, publicSiteUrl } from "@/lib/patients/whatsapp"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export type InviteTherapistState = {
  error?: string
  status?: number
  ok?: boolean
  therapistName?: string
  inviteLink?: string
  whatsappHref?: string
}

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function therapistInviteMessage(input: {
  therapistName: string
  clinicName: string
  inviteLink: string
}): string {
  const firstName = input.therapistName.trim().split(/\s+/)[0] ?? input.therapistName
  return [
    `Salut ${firstName}! Te-am adăugat în echipa clinicii ${input.clinicName} pe KinetoFlow.`,
    "Activează-ți accesul (un tap, fără email) de pe acest link unic:",
    input.inviteLink,
  ].join("\n")
}

function extractActionLink(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }
  const record = payload as {
    properties?: { action_link?: string }
    action_link?: string
  }
  if (typeof record.properties?.action_link === "string" && record.properties.action_link.length > 0) {
    return record.properties.action_link
  }
  if (typeof record.action_link === "string" && record.action_link.length > 0) {
    return record.action_link
  }
  return null
}

export async function inviteTherapistAction(formData: FormData): Promise<InviteTherapistState> {
  const therapistName = readTrimmed(formData, "therapist_name")
  const phoneRaw = readTrimmed(formData, "phone")

  if (therapistName.length < 2) {
    return { error: "Introdu numele complet al terapeutului." }
  }

  const phone = normalizeStoredPhone(phoneRaw)
  if (!phone) {
    return { error: "Numărul de telefon este obligatoriu (format 07xx sau +40)." }
  }

  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", status: 401 }
  }

  const { profile, error: profileError } = await fetchClinicProfile(supabase, user.id)
  if (profileError) {
    return { error: profileError }
  }
  if (!profile) {
    return { error: "Completează mai întâi profilul clinicii." }
  }
  if (!isClinicAdmin(profile)) {
    throw new ForbiddenError("Doar administratorul clinicii poate invita terapeuți.")
  }

  const clinicName = profile.clinic_name.trim()
  if (!clinicName) {
    return { error: "Profilul cabinetului este incomplet. Reîncarcă pagina." }
  }
  const clinicOwnerId = profile.user_id
  const technicalEmail = newTherapistTechnicalEmail(therapistName)
  const redirectTo = `${publicSiteUrl()}/auth/callback?next=/dashboard`

  try {
    const admin = createServiceRoleClient()

    const { data: existingPhone } = await admin
      .from("clinic_profiles")
      .select("user_id")
      .eq("clinic_name", clinicName)
      .eq("phone", phone)
      .maybeSingle()

    if (existingPhone) {
      return { error: "Există deja un terapeut cu acest număr de telefon în cabinet." }
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: technicalEmail,
      password: randomAccountPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: therapistName,
        clinic_name: clinicName,
        clinic_id: clinicOwnerId,
        phone,
        invited_by: user.id,
        role: "therapist",
      },
      app_metadata: {
        clinic_id: clinicOwnerId,
        role: "therapist",
      },
    })

    if (createError || !created.user) {
      return { error: createError ? formatSupabaseError(createError) : "Nu am putut crea contul terapeutului." }
    }

    const invitedUserId = created.user.id

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: technicalEmail,
      options: { redirectTo },
    })

    let inviteLink = extractActionLink(linkData)
    if (linkError || !inviteLink) {
      const recovery = await admin.auth.admin.generateLink({
        type: "recovery",
        email: technicalEmail,
        options: { redirectTo },
      })
      inviteLink = extractActionLink(recovery.data)
      if (!inviteLink) {
        return { error: linkError ? formatSupabaseError(linkError) : "Nu am putut genera linkul de acces." }
      }
    }

    const { error: insertError } = await admin.from("clinic_profiles").insert({
      user_id: invitedUserId,
      clinic_name: clinicName,
      therapist_name: therapistName,
      phone,
      role: "therapist",
    })

    if (insertError) {
      return { error: formatSupabaseError(insertError) }
    }

    const message = therapistInviteMessage({
      therapistName,
      clinicName,
      inviteLink,
    })
    const whatsappHref = patientWhatsAppHref(phone, message)

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/echipa")
    return {
      ok: true,
      therapistName,
      inviteLink,
      whatsappHref: whatsappHref ?? undefined,
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error
    }
    const message = error instanceof Error ? error.message : "Nu am putut invita terapeutul."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}
