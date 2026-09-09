import { NextResponse, type NextRequest } from "next/server"

export function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  const setCookies = from.headers.getSetCookie()
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      to.headers.append("Set-Cookie", cookie)
    }
    return to
  }

  from.cookies.getAll().forEach((cookie) => {
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
