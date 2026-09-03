"use server"

import { redirect } from "next/navigation"

import { getCachedUser } from "@/lib/auth/session"
import { evaluateRegisterPassword, REGISTER_PASSWORD_HINT } from "@/lib/auth/password"
import { formatSupabaseError } from "@/lib/supabase/format-error"

export type SetPasswordState = {
  error?: string
} | null

export async function setInvitePassword(formData: FormData): Promise<SetPasswordState> {
  const passwordRaw = formData.get("password")
  const confirmRaw = formData.get("confirm_password")
  const password = typeof passwordRaw === "string" ? passwordRaw : ""
  const confirm = typeof confirmRaw === "string" ? confirmRaw : ""

  if (!evaluateRegisterPassword(password).isValid) {
    return { error: REGISTER_PASSWORD_HINT }
  }
  if (password !== confirm) {
    return { error: "Parolele nu coincid." }
  }

  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Deschide din nou linkul de pe WhatsApp." }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: formatSupabaseError(error) }
  }

  redirect("/dashboard")
}
