"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

export async function redirectAfterTherapistAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const ready = await therapistHasClinicProfile(supabase, user.id)
  revalidatePath("/", "layout")
  redirect(ready ? "/dashboard" : "/onboarding")
}
