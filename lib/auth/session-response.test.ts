import assert from "node:assert/strict"
import { test } from "node:test"

import { isPublicMarketingPath, shouldStayOnTherapistLogin, therapistAppPath } from "./paths.ts"
import { isSupabaseAuthCookieName, oauthBrowserRedirectTo, therapistEnterPath } from "./oauth-redirect.ts"

test("landing-ul public e pagina de marketing, nu dashboard-ul", () => {
  assert.equal(isPublicMarketingPath("/"), true)
  assert.equal(isPublicMarketingPath("/early-access"), true)
  assert.equal(isPublicMarketingPath("/login"), false)
  assert.equal(isPublicMarketingPath("/dashboard"), false)
  assert.equal(isPublicMarketingPath("/acces"), false)
})

test("terapeutul cu clinică merge în dashboard, altfel la onboarding", () => {
  assert.equal(therapistAppPath(true), "/dashboard")
  assert.equal(therapistAppPath(false), "/onboarding")
})

test("după deconectarea de pe invitație, /login?signedout=1 nu e aruncat în clinică", () => {
  assert.equal(shouldStayOnTherapistLogin("signedout=1"), true)
  assert.equal(shouldStayOnTherapistLogin("?signedout=1"), true)
  assert.equal(shouldStayOnTherapistLogin(new URLSearchParams("signedout=1")), true)
  assert.equal(shouldStayOnTherapistLogin("reason=oauth"), false)
  assert.equal(shouldStayOnTherapistLogin(null), false)
})

test("după login, destinația implicită e dashboard-ul clinicii", () => {
  assert.equal(therapistEnterPath("/dashboard"), "/dashboard")
  assert.equal(therapistEnterPath("/onboarding"), "/onboarding")
  assert.equal(therapistEnterPath(null), "/dashboard")
  assert.equal(therapistEnterPath("/"), "/dashboard")
})

test("callback-ul Google duce în dashboard, nu pe pagina principală", () => {
  assert.equal(
    oauthBrowserRedirectTo("https://app.example", { next: "/dashboard" }),
    "https://app.example/auth/callback?next=%2Fdashboard",
  )
  assert.match(
    oauthBrowserRedirectTo("https://app.example", { next: "/dashboard", invite: "tok" }),
    /invite=tok/,
  )
})

test("recunoaște cookie-urile de sesiune Supabase", () => {
  assert.equal(isSupabaseAuthCookieName("sb-xxxx-auth-token"), true)
  assert.equal(isSupabaseAuthCookieName("sb-xxxx-auth-token.0"), true)
  assert.equal(isSupabaseAuthCookieName("kf_early_access"), false)
})
