"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { therapistAppPath } from "@/lib/auth/paths"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

export async function redirectAfterTherapistAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  if (!isEmailConfirmedUser(user)) {
    await supabase.auth.signOut()
    redirect("/login?reason=confirm_email")
  }

  const ready = clinicReadyFromUser(user) || (await therapistHasClinicProfile(supabase, user.id))
  revalidatePath("/dashboard")
  revalidatePath("/onboarding")
  redirect(therapistAppPath(ready))
}
