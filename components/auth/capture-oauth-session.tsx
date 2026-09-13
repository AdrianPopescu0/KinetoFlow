"use client"

import { useEffect, useRef } from "react"

import { enterTherapistApp } from "@/lib/auth/oauth-redirect"
import { safeAuthNextPath } from "@/lib/auth/paths"
import {
  hasOAuthTokensInLocation,
  persistOAuthSessionFromLocation,
  stripOAuthTokensFromUrl,
} from "@/lib/auth/oauth-session-url"
import { persistTherapistInviteToken, readStoredTherapistInviteToken } from "@/lib/clinics/invite-session"
import { createClient } from "@/utils/supabase/client"

const COMPLETE_TIMEOUT_MS = 8000

/**
 * Preia tokenii din hash/query, îi scrie imediat în sesiune (cookie-uri)
 * și așteaptă `onAuthStateChange` înainte de a intra în aplicație —
 * ca să nu fim aruncați afară pe prima logare, înainte să se salveze sesiunea.
 */
export function CaptureOAuthSession({
  mode,
}: {
  mode: "landing" | "login" | "complete"
}) {
  const entered = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    const location = { search: window.location.search, hash: window.location.hash }
    const params = new URLSearchParams(window.location.search)
    const invite = params.get("invite") ?? readStoredTherapistInviteToken()
    if (invite) {
      persistTherapistInviteToken(invite)
    }
    const next = safeAuthNextPath(params.get("next")) ?? "/dashboard"

    function enter() {
      if (entered.current) {
        return
      }
      entered.current = true
      stripOAuthTokensFromUrl()
      enterTherapistApp(next)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        return
      }
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION" && event !== "TOKEN_REFRESHED") {
        return
      }
      const tokensInUrl = hasOAuthTokensInLocation(location)
      if (tokensInUrl && event === "INITIAL_SESSION") {
        return
      }
      if (tokensInUrl || mode === "complete" || (mode === "landing" && event === "INITIAL_SESSION")) {
        enter()
      }
    })

    void persistOAuthSessionFromLocation(supabase, location, {
      exchangeCode: mode === "complete",
    })
      .then((result) => {
        if (result !== "none") {
          stripOAuthTokensFromUrl()
        }
      })
      .catch((error) => {
        console.error("Nu am putut salva sesiunea Google din URL:", error)
        if (mode === "complete" && !entered.current) {
          window.location.replace("/login?reason=oauth")
        }
      })

    const timeout =
      mode === "complete"
        ? window.setTimeout(() => {
            if (!entered.current) {
              window.location.replace("/login?reason=oauth")
            }
          }, COMPLETE_TIMEOUT_MS)
        : undefined

    return () => {
      subscription.unsubscribe()
      if (timeout) {
        window.clearTimeout(timeout)
      }
    }
  }, [mode])

  return null
}
