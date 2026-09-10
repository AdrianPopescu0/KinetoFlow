"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { isSupabaseAuthCookieName, SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { LOGIN_SIGNED_OUT_HREF } from "@/lib/auth/paths"
import { createClient } from "@/utils/supabase/server"

export async function signOutToLogin() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const jar = await cookies()
  for (const cookie of jar.getAll()) {
    if (isSupabaseAuthCookieName(cookie.name)) {
      jar.set(cookie.name, "", { path: "/", maxAge: 0 })
    }
  }
  jar.set(SIGNED_OUT_GATE_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60,
  })

  revalidatePath("/", "layout")
  redirect(LOGIN_SIGNED_OUT_HREF)
}
