import { NextResponse, type NextRequest } from "next/server"

import { EARLY_ACCESS_COOKIE } from "@/lib/auth/early-access-constants"

export function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  const copied = new Set<string>()
  const setCookies = from.headers.getSetCookie()
  for (const cookie of setCookies) {
    to.headers.append("Set-Cookie", cookie)
    const name = cookie.split("=")[0]?.trim()
    if (name) {
      copied.add(name)
    }
  }

  from.cookies.getAll().forEach((cookie) => {
    if (copied.has(cookie.name) || cookie.name === EARLY_ACCESS_COOKIE) {
      return
    }
    to.cookies.set(cookie.name, cookie.value, { path: "/" })
  })
  return to
}

export function redirectWithAuthCookies(
  request: NextRequest,
  source: NextResponse,
  pathname: string,
  search = "",
): NextResponse {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = pathname
  redirectUrl.search = search
  return copyCookies(source, NextResponse.redirect(redirectUrl))
}
