const GENERIC_CONFIG_ERROR =
  "Lipsește configurația Supabase. Setează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sau NEXT_PUBLIC_SUPABASE_ANON_KEY)."

export type SupabasePublicEnv = {
  url: string
  anonKey: string
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(GENERIC_CONFIG_ERROR)
  }

  if (anonKey.startsWith("sb_secret_")) {
    throw new Error(
      "Cheia secretă Supabase nu poate fi folosită în client. Folosește cheia publicabilă (sb_publishable_…).",
    )
  }

  return { url, anonKey }
}

export function getSupabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY
}
