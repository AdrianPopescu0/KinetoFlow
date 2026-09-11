import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/utils/supabase/middleware"

const EARLY_ACCESS_COOKIE = "early_access_verified"
const EARLY_ACCESS_PAGE = "/early-access"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.cookies.get(EARLY_ACCESS_COOKIE)?.value) {
    if (pathname.startsWith("/api/cron")) {
      return NextResponse.next()
    }
    return updateSession(request)
  }

  if (pathname === EARLY_ACCESS_PAGE || pathname.startsWith(`${EARLY_ACCESS_PAGE}/`)) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next()
  }

  if (
    pathname === "/acces" ||
    pathname.startsWith("/acces/") ||
    pathname === "/patient" ||
    pathname.startsWith("/patient/") ||
    pathname === "/p" ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/auth/")
  ) {
    return updateSession(request)
  }

  const url = request.nextUrl.clone()
  url.pathname = EARLY_ACCESS_PAGE
  url.search = ""
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|firebase-messaging-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
