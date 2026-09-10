"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { confirmAuthUserEmailById } from "@/lib/auth/verified-password-session"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { therapistAppPath } from "@/lib/auth/paths"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { invitedTherapistFromUser } from "@/lib/clinics/clinic-ready"
import { readTherapistInviteToken } from "@/lib/clinics/invite-attach"
import {
  THERAPIST_INVITE_CLIENT_COOKIE,
  THERAPIST_INVITE_COOKIE,
  inviteTokenFromAuthUser,
} from "@/lib/clinics/invite-session"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

export type TherapistAppPath = "/dashboard" | "/onboarding"

/**
 * Calculează destinația după login. Nu apelează `redirect()` — cookie-urile
 * de sesiune trebuie să plece pe răspunsul acțiunii, apoi clientul face
 * un document request către această cale.
 */
export async function resolveTherapistAppPath(): Promise<TherapistAppPath> {
  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)

  const supabase = await createClient()
  const {
    data: { user: initialUser },
  } = await supabase.auth.getUser()

  let user = initialUser
  if (user && !isEmailConfirmedUser(user)) {
    await confirmAuthUserEmailById(user.id)
    await supabase.auth.refreshSession()
    user = (await supabase.auth.getUser()).data.user
  }

  if (!user || !isEmailConfirmedUser(user)) {
    // Sesiunea e scrisă; middleware duce pe onboarding/dashboard sau înapoi la login.
    return "/dashboard"
  }

  const inviteToken = readTherapistInviteToken(
    null,
    jar.get(THERAPIST_INVITE_COOKIE)?.value,
    jar.get(THERAPIST_INVITE_CLIENT_COOKIE)?.value,
    inviteTokenFromAuthUser(user),
  )
  if (inviteToken) {
    await supabase.auth.updateUser({
      data: {
        invite_token: inviteToken,
        invited: true,
        role: "therapist",
      },
    })
    const attached = await attachTherapistInviteToUser({ token: inviteToken, user })
    if (attached.ok) {
      jar.delete(THERAPIST_INVITE_COOKIE)
      jar.delete(THERAPIST_INVITE_CLIENT_COOKIE)
      return "/dashboard"
    }
  }

  if (invitedTherapistFromUser(user)) {
    return "/dashboard"
  }

  const ready = clinicReadyFromUser(user) || (await therapistHasClinicProfile(supabase, user.id))
  return therapistAppPath(ready)
}

export async function redirectAfterTherapistAuth() {
  redirect(await resolveTherapistAppPath())
}
