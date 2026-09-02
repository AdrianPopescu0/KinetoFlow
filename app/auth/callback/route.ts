import { NextResponse } from "next/server"

import { therapistHasClinicProfile } from "@/lib/clinics/profile"
import { safeAuthNextPath } from "@/lib/auth/paths"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeAuthNextPath(searchParams.get("next")) ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const clinicReady = await therapistHasClinicProfile(supabase, user.id)
        if (!clinicReady) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next === "/onboarding" ? "/dashboard" : next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
