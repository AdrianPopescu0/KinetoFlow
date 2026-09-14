import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/database.types"
import { getSupabasePublicEnv } from "@/utils/supabase/env"

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv()

  return createBrowserClient<Database>(url, anonKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      flowType: "pkce",
    },
  })
}
