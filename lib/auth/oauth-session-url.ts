export type OAuthTokensFromUrl = {
  code: string | null
  accessToken: string | null
  refreshToken: string | null
}

export function readOAuthTokensFromLocation(location: {
  search?: string
  hash?: string
}): OAuthTokensFromUrl {
  const search = location.search ?? ""
  const hash = location.hash ?? ""
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash)

  return {
    code: query.get("code"),
    accessToken: fragment.get("access_token") ?? query.get("access_token"),
    refreshToken: fragment.get("refresh_token") ?? query.get("refresh_token"),
  }
}

export function hasOAuthTokensInLocation(location: { search?: string; hash?: string }): boolean {
  const tokens = readOAuthTokensFromLocation(location)
  return Boolean(tokens.code || (tokens.accessToken && tokens.refreshToken))
}

type SessionAuthClient = {
  auth: {
    setSession: (session: {
      access_token: string
      refresh_token: string
    }) => Promise<{ error: { message: string } | null }>
    exchangeCodeForSession: (code: string) => Promise<{ error: { message: string } | null }>
  }
}

export async function persistOAuthSessionFromLocation(
  supabase: SessionAuthClient,
  location: { search?: string; hash?: string },
  options: { exchangeCode?: boolean } = {},
): Promise<"set" | "exchanged" | "none"> {
  const tokens = readOAuthTokensFromLocation(location)

  if (tokens.accessToken && tokens.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    })
    if (error) {
      throw new Error(error.message)
    }
    return "set"
  }

  if (options.exchangeCode && tokens.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(tokens.code)
    if (error) {
      throw new Error(error.message)
    }
    return "exchanged"
  }

  return "none"
}

export function stripOAuthTokensFromUrl() {
  if (typeof window === "undefined") {
    return
  }
  const url = new URL(window.location.href)
  url.hash = ""
  url.searchParams.delete("access_token")
  url.searchParams.delete("refresh_token")
  url.searchParams.delete("expires_in")
  url.searchParams.delete("expires_at")
  url.searchParams.delete("token_type")
  url.searchParams.delete("provider_token")
  url.searchParams.delete("provider_refresh_token")
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`)
}
