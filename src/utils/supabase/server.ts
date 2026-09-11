import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { EARLY_ACCESS_COOKIE } from "@/lib/auth/early-access-constants"
import type { Database } from "@/lib/supabase/database.types"
import { getSupabasePublicEnv } from "@/utils/supabase/env"

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabasePublicEnv()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (name === EARLY_ACCESS_COOKIE) {
              return
            }
            cookieStore.set(name, value, { ...options, path: "/" })
          })
        } catch {
          // Called from a Server Component; middleware refreshes the session.
        }
      },
    },
  })
}
