import { NextResponse, type NextRequest } from "next/server"

import { requestAppOrigin } from "@/lib/auth/site-origin"
import { getCachedUser } from "@/lib/auth/session"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { readTherapistInviteToken, therapistInvitePagePath } from "@/lib/clinics/invite-attach"
import {
  THERAPIST_INVITE_CLIENT_COOKIE,
  THERAPIST_INVITE_COOKIE,
  clearTherapistInviteCookies,
  inviteTokenFromAuthUser,
  writeTherapistInviteCookies,
} from "@/lib/clinics/invite-session"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

function absoluteUrl(request: NextRequest, path: string) {
  const origin = requestAppOrigin(request)
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`
}

function clearInviteCookie(response: NextResponse) {
  clearTherapistInviteCookies((name, value, options) => response.cookies.set(name, value, options))
}

function stampInviteCookie(response: NextResponse, token: string) {
  writeTherapistInviteCookies((name, value, options) => response.cookies.set(name, value, options), token)
}

export async function GET(request: NextRequest) {
  const { user } = await getCachedUser()
  const inviteToken = readTherapistInviteToken(
    request.nextUrl.searchParams.get("invite"),
    request.cookies.get(THERAPIST_INVITE_COOKIE)?.value,
    request.cookies.get(THERAPIST_INVITE_CLIENT_COOKIE)?.value,
    inviteTokenFromAuthUser(user),
  )

  if (!user) {
    const path = inviteToken ? therapistInvitePagePath(inviteToken) : "/login"
    const response = NextResponse.redirect(absoluteUrl(request, path), 303)
    if (inviteToken) {
      stampInviteCookie(response, inviteToken)
    }
    return response
  }

  const supabase = await createClient()

  if (!inviteToken) {
    const attached = await attachTherapistInviteToUser({ user })
    if (attached.ok) {
      await supabase.auth.refreshSession()
      const response = NextResponse.redirect(absoluteUrl(request, "/dashboard"), 303)
      clearInviteCookie(response)
      return response
    }
    return NextResponse.redirect(absoluteUrl(request, "/dashboard"), 303)
  }

  await supabase.auth.updateUser({
    data: {
      invite_token: inviteToken,
      invited: true,
      role: "therapist",
    },
  })

  const attached = await attachTherapistInviteToUser({ token: inviteToken, user })
  if (!attached.ok) {
    await supabase.auth.signOut()
    const response = NextResponse.redirect(
      absoluteUrl(request, therapistInvitePagePath(inviteToken, attached.reason)),
      303,
    )
    clearInviteCookie(response)
    return response
  }

  await supabase.auth.refreshSession()
  const {
    data: { user: refreshed },
  } = await supabase.auth.getUser()
  const clinicReady =
    (refreshed ? clinicReadyFromUser(refreshed) : false) || (await therapistHasClinicProfile(supabase, user.id))
  const response = NextResponse.redirect(absoluteUrl(request, "/dashboard"), 303)
  if (clinicReady) {
    clearInviteCookie(response)
  } else {
    stampInviteCookie(response, inviteToken)
  }
  return response
}
