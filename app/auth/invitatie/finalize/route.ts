import { NextResponse, type NextRequest } from "next/server"

import { requestAppOrigin } from "@/lib/auth/site-origin"
import { getCachedUser } from "@/lib/auth/session"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { readTherapistInviteToken, therapistInvitePagePath } from "@/lib/clinics/invite-attach"
import {
  THERAPIST_INVITE_COOKIE,
  therapistInviteCookieOptions,
} from "@/lib/clinics/invite-session"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

function absoluteUrl(request: NextRequest, path: string) {
  const origin = requestAppOrigin(request)
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`
}

function clearInviteCookie(response: NextResponse) {
  response.cookies.set(THERAPIST_INVITE_COOKIE, "", { ...therapistInviteCookieOptions(), maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const inviteToken = readTherapistInviteToken(
    request.nextUrl.searchParams.get("invite"),
    request.cookies.get(THERAPIST_INVITE_COOKIE)?.value,
  )

  const { user } = await getCachedUser()
  if (!user) {
    const path = inviteToken ? therapistInvitePagePath(inviteToken) : "/login"
    return NextResponse.redirect(absoluteUrl(request, path), 303)
  }

  if (!inviteToken) {
    return NextResponse.redirect(absoluteUrl(request, "/dashboard"), 303)
  }

  const attached = await attachTherapistInviteToUser({ token: inviteToken, user })
  if (!attached.ok) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    const response = NextResponse.redirect(
      absoluteUrl(request, therapistInvitePagePath(inviteToken, attached.reason)),
      303,
    )
    clearInviteCookie(response)
    return response
  }

  const supabase = await createClient()
  await supabase.auth.refreshSession()
  const clinicReady = clinicReadyFromUser(user) || (await therapistHasClinicProfile(supabase, user.id))
  const response = NextResponse.redirect(absoluteUrl(request, "/dashboard"), 303)
  if (clinicReady) {
    clearInviteCookie(response)
  } else {
    response.cookies.set(THERAPIST_INVITE_COOKIE, inviteToken, therapistInviteCookieOptions())
  }
  return response
}
