const GENERIC_CONFIG_ERROR =
  "Lipsește configurația Supabase. Setează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY."

const UNCONFIGURED_URL_MARKERS = ["placeholder.supabase.co", "your-project.supabase.co"]

export type SupabasePublicEnv = {
  url: string
  anonKey: string
}

function isElevatedKey(value: string): boolean {
  return value.startsWith("sb_secret_") || value.includes("service_role")
}

export function isUnconfiguredSupabaseUrl(url: string): boolean {
  return UNCONFIGURED_URL_MARKERS.some((marker) => url.includes(marker))
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !anonKey) {
    throw new Error(GENERIC_CONFIG_ERROR)
  }

  if (isElevatedKey(anonKey)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / sb_secret_ nu poate fi folosită în client. Folosește NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  return { url, anonKey }
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
}
