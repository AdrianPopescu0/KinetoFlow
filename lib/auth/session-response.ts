import { NextResponse, type NextRequest } from "next/server"

export function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.headers.getSetCookie()) {
    to.headers.append("Set-Cookie", cookie)
  }
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
