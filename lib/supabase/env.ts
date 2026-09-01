const GENERIC_CONFIG_ERROR =
  "Lipsește configurația Supabase. Setează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY."

export type SupabasePublicEnv = {
  url: string
  anonKey: string
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(GENERIC_CONFIG_ERROR)
  }

  return { url, anonKey }
}
