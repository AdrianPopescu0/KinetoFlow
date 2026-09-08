import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/cron")) {
    return NextResponse.next()
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|firebase-messaging-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
