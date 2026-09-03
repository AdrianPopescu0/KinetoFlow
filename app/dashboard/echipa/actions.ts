"use server"

import { revalidatePath } from "next/cache"

import { getCachedUser } from "@/lib/auth/session"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { isClinicAdmin } from "@/lib/clinics/types"
import { ForbiddenError } from "@/lib/http/forbidden"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { publicSiteUrl } from "@/lib/patients/whatsapp"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export type InviteTherapistState = {
  error?: string
  status?: number
  ok?: boolean
  invitedEmail?: string
}

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

export async function inviteTherapistAction(formData: FormData): Promise<InviteTherapistState> {
  const therapistName = readTrimmed(formData, "therapist_name")
  const email = readTrimmed(formData, "email").toLowerCase()
  const phoneRaw = readTrimmed(formData, "phone")

  if (therapistName.length < 2) {
    return { error: "Introdu numele terapeutului." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email-ul nu pare valid." }
  }

  let phone: string | null = null
  if (phoneRaw.length > 0) {
    phone = normalizeStoredPhone(phoneRaw)
    if (!phone) {
      return { error: "Numărul de telefon nu este valid. Folosește un format românesc, de exemplu 07xx xxx xxx." }
    }
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

  const clinicId = profile.clinic_id
  const redirectTo = `${publicSiteUrl()}/auth/callback?next=/dashboard`

  try {
    const admin = createServiceRoleClient()
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: therapistName,
        clinic_name: profile.clinic_name,
        clinic_id: clinicId,
        phone: phone ?? "",
        invited_by: user.id,
      },
      redirectTo,
    })

    if (inviteError || !invited.user) {
      const message = inviteError?.message ?? "Nu am putut trimite invitația."
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")) {
        return { error: "Există deja un cont cu acest email." }
      }
      return { error: inviteError ? formatSupabaseError(inviteError) : message }
    }

    const invitedUserId = invited.user.id

    await admin.auth.admin.updateUserById(invitedUserId, {
      app_metadata: { clinic_id: clinicId },
      user_metadata: {
        full_name: therapistName,
        clinic_name: profile.clinic_name,
        clinic_id: clinicId,
        phone: phone ?? "",
      },
    })

    const { error: insertError } = await admin.from("clinic_profiles").insert({
      user_id: invitedUserId,
      clinic_id: clinicId,
      clinic_name: profile.clinic_name,
      therapist_name: therapistName,
      phone,
      role: "therapist",
    })

    if (insertError) {
      return { error: formatSupabaseError(insertError) }
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

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/echipa")
  return { ok: true, invitedEmail: email }
}
