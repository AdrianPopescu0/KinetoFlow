"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { confirmAuthUserEmailById } from "@/lib/auth/verified-password-session"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { therapistAppPath } from "@/lib/auth/paths"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

export async function redirectAfterTherapistAuth() {
  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)

  const supabase = await createClient()
  const {
    data: { user: initialUser },
  } = await supabase.auth.getUser()

  let user = initialUser
  if (!user) {
    redirect("/login")
  }

  if (!isEmailConfirmedUser(user)) {
    await confirmAuthUserEmailById(user.id)
    await supabase.auth.refreshSession()
    const refreshed = await supabase.auth.getUser()
    user = refreshed.data.user
    if (!user || !isEmailConfirmedUser(user)) {
      await supabase.auth.signOut()
      redirect("/login?reason=confirm_email")
    }
  }

  const ready = clinicReadyFromUser(user) || (await therapistHasClinicProfile(supabase, user.id))
  redirect(therapistAppPath(ready))
}
