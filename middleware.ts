import { NextResponse, type NextRequest } from "next/server"

import { EARLY_ACCESS_COOKIE } from "@/lib/auth/early-access-constants"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  const earlyAccessUnlocked = Boolean(request.cookies.get(EARLY_ACCESS_COOKIE)?.value)

  if (request.nextUrl.pathname.startsWith("/api/cron")) {
    return NextResponse.next()
  }

  return updateSession(request, { earlyAccessUnlocked })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|firebase-messaging-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
