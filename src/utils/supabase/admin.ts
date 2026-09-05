import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/utils/supabase/env"

export function createServiceRoleClient() {
  const { url } = getSupabasePublicEnv()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!serviceRoleKey) {
    throw new Error("Lipsește SUPABASE_SERVICE_ROLE_KEY în .env.local.")
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
