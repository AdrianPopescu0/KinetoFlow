"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AUTH_ERROR_MESSAGE, parseLoginCredentials } from "@/lib/auth/validation"
import { createClient } from "@/lib/supabase/server"

export type LoginActionState = {
  error: string
} | null

export async function login(formData: FormData): Promise<LoginActionState> {
  const credentials = parseLoginCredentials(formData)

  if (!credentials) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
